import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "standardwebhooks";

type DodoEventData = {
    subscription?: { id: string; payment_id?: string; amount: number; currency: string };
    customer?: { id: string };
    payment?: { id: string; amount: number; currency: string; payment_method?: string; description?: string };
    metadata?: { user_id?: string; plan_name?: string; billing_cycle?: string };
};

type DodoWebhookEvent = {
    type: string;
    data: DodoEventData;
};

// Use service role key for webhook operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        // Get webhook headers
        const webhookId = request.headers.get("webhook-id");
        const webhookSignature = request.headers.get("webhook-signature");
        const webhookTimestamp = request.headers.get("webhook-timestamp");

        if (!webhookId || !webhookSignature || !webhookTimestamp) {
            return NextResponse.json(
                { error: "Missing webhook headers" },
                { status: 400 }
            );
        }

        // Get raw body
        const payload = await request.text();

        // Verify webhook signature
        const wh = new Webhook(process.env.DODO_WEBHOOK_SECRET!);
        try {
            wh.verify(payload, {
                "webhook-id": webhookId,
                "webhook-signature": webhookSignature,
                "webhook-timestamp": webhookTimestamp,
            });
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        // Parse the event
        const eventData = JSON.parse(payload);
        const eventType = eventData.type;

        console.log(`Processing webhook event: ${eventType}`);

        // Handle different event types
        switch (eventType) {
            case "subscription.active":
                await handleSubscriptionActive(eventData);
                break;

            case "subscription.renewed":
                await handleSubscriptionRenewed(eventData);
                break;

            case "subscription.cancelled":
                await handleSubscriptionCancelled(eventData);
                break;

            case "subscription.expired":
                await handleSubscriptionExpired(eventData);
                break;

            case "subscription.on_hold":
                await handleSubscriptionOnHold(eventData);
                break;

            case "subscription.plan_changed":
                await handleSubscriptionPlanChanged(eventData);
                break;

            case "payment.processing":
                // Activate immediately on processing — treat same as succeeded
                await handlePaymentSucceeded(eventData);
                break;

            case "payment.succeeded":
                await handlePaymentSucceeded(eventData);
                break;

            case "payment.failed":
                await handlePaymentFailed(eventData);
                break;

            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

async function handleSubscriptionActive(event: DodoWebhookEvent) {
    const { subscription, customer, metadata } = event.data;
    const userId = metadata?.user_id;
    const planName = metadata?.plan_name;
    const billingCycle = metadata?.billing_cycle || "monthly";

    if (!userId || !planName) {
        console.error("Missing user_id or plan_name in metadata");
        return;
    }

    // Calculate period dates
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    if (billingCycle === "monthly") {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    // Create or update subscription
    const { error: subError } = await supabaseAdmin
        .from("user_subscriptions")
        .upsert({
            user_id: userId,
            plan_name: planName,
            status: "active",
            dodo_subscription_id: subscription?.id,
            dodo_customer_id: customer?.id,
            dodo_payment_id: subscription?.payment_id,
            current_period_start: currentPeriodStart.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            amount: (subscription?.amount ?? 0) / 100,
            currency: subscription?.currency,
            billing_cycle: billingCycle,
        }, {
            onConflict: "dodo_subscription_id",
        });

    if (subError) {
        console.error("Error creating subscription:", subError);
        return;
    }

    // Update user profile
    await supabaseAdmin
        .from("user_profiles")
        .update({
            subscription_plan: planName,
            dodo_customer_id: customer?.id,
        })
        .eq("id", userId);

    console.log(`Subscription activated for user ${userId}, plan ${planName}`);
}

async function handleSubscriptionRenewed(event: DodoWebhookEvent) {
    const { subscription } = event.data;

    // Update subscription period
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(currentPeriodStart);

    const { data: existingSub } = await supabaseAdmin
        .from("user_subscriptions")
        .select("billing_cycle")
        .eq("dodo_subscription_id", subscription?.id)
        .single();

    if (existingSub?.billing_cycle === "monthly") {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    await supabaseAdmin
        .from("user_subscriptions")
        .update({
            current_period_start: currentPeriodStart.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            status: "active",
            updated_at: new Date().toISOString(),
        })
        .eq("dodo_subscription_id", subscription?.id);

    console.log(`Subscription renewed: ${subscription?.id}`);
}

async function handleSubscriptionCancelled(event: DodoWebhookEvent) {
    const { subscription } = event.data;

    await supabaseAdmin
        .from("user_subscriptions")
        .update({
            status: "cancelled",
            cancel_at_period_end: true,
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("dodo_subscription_id", subscription?.id);

    console.log(`Subscription cancelled: ${subscription?.id}`);
}

async function handleSubscriptionExpired(event: DodoWebhookEvent) {
    const { subscription } = event.data;

    await supabaseAdmin
        .from("user_subscriptions")
        .update({
            status: "expired",
            updated_at: new Date().toISOString(),
        })
        .eq("dodo_subscription_id", subscription?.id);

    console.log(`Subscription expired: ${subscription?.id}`);
}

async function handleSubscriptionOnHold(event: DodoWebhookEvent) {
    const { subscription } = event.data;

    await supabaseAdmin
        .from("user_subscriptions")
        .update({
            status: "on_hold",
            updated_at: new Date().toISOString(),
        })
        .eq("dodo_subscription_id", subscription?.id);

    console.log(`Subscription on hold: ${subscription?.id}`);
}

async function handleSubscriptionPlanChanged(event: DodoWebhookEvent) {
    const { subscription, metadata } = event.data;
    const newPlanName = metadata?.plan_name;

    if (!newPlanName) {
        console.error("Missing plan_name in metadata");
        return;
    }

    await supabaseAdmin
        .from("user_subscriptions")
        .update({
            plan_name: newPlanName,
            amount: (subscription?.amount ?? 0) / 100,
            updated_at: new Date().toISOString(),
        })
        .eq("dodo_subscription_id", subscription?.id);

    // Update user profile
    const { data: sub } = await supabaseAdmin
        .from("user_subscriptions")
        .select("user_id")
        .eq("dodo_subscription_id", subscription?.id)
        .single();

    if (sub) {
        await supabaseAdmin
            .from("user_profiles")
            .update({ subscription_plan: newPlanName })
            .eq("id", sub.user_id);
    }

    console.log(`Subscription plan changed: ${subscription?.id} to ${newPlanName}`);
}

async function handlePaymentSucceeded(event: DodoWebhookEvent) {
    const { payment, customer, metadata } = event.data;
    const userId = metadata?.user_id;
    const planName = metadata?.plan_name;
    const billingCycle = metadata?.billing_cycle ?? "monthly";

    // Record payment
    if (payment) {
        await supabaseAdmin.from("payment_history").insert({
            user_id: userId,
            dodo_payment_id: payment.id,
            dodo_customer_id: customer?.id,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: "succeeded",
            payment_method: payment.payment_method,
            description: payment.description,
            metadata: metadata,
        });
    }

    // Immediately activate subscription
    if (userId) {
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        if (billingCycle === "monthly") {
            currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        } else {
            currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        }

        await supabaseAdmin.from("user_subscriptions").upsert(
            {
                user_id: userId,
                plan_name: planName ?? "basic",
                status: "active",
                dodo_customer_id: customer?.id,
                current_period_start: currentPeriodStart.toISOString(),
                current_period_end: currentPeriodEnd.toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        );

        if (planName) {
            await supabaseAdmin
                .from("user_profiles")
                .update({ subscription_plan: planName, dodo_customer_id: customer?.id })
                .eq("id", userId);
        }

        console.log(`Subscription activated for user ${userId} after payment.`);
    }

    console.log(`Payment event processed: ${payment?.id}`);
}

async function handlePaymentFailed(event: DodoWebhookEvent) {
    const { payment, customer, metadata } = event.data;
    const userId = metadata?.user_id;

    if (payment) {
        await supabaseAdmin.from("payment_history").insert({
            user_id: userId,
            dodo_payment_id: payment.id,
            dodo_customer_id: customer?.id,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: "failed",
            payment_method: payment.payment_method,
            description: payment.description,
            metadata: metadata,
        });
    }

    console.log(`Payment failed: ${payment?.id}`);
}
