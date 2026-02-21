import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "standardwebhooks";

// ---------------------------------------------------------------------------
// Typed shapes derived from the Dodo Payments webhook documentation
// ---------------------------------------------------------------------------

interface DodoCustomer {
    customer_id?: string;
    email?: string;
    name?: string;
}

interface DodoMetadata {
    user_id?: string;
    plan_name?: string;
    billing_cycle?: string;
    [key: string]: string | undefined;
}

interface DodoSubscriptionData {
    payload_type: "Subscription";
    subscription_id: string;
    customer: DodoCustomer;
    product_id?: string;
    status?: string;
    recurring_pre_tax_amount?: number; // cents
    currency?: string;
    next_billing_date?: string;
    previous_billing_date?: string;
    cancelled_at?: string;
    cancel_at_next_billing_date?: boolean;
    metadata?: DodoMetadata;
}

interface DodoPaymentData {
    payload_type: "Payment";
    payment_id: string;
    customer: DodoCustomer;
    total_amount?: number; // cents
    currency?: string;
    payment_method?: string;
    subscription_id?: string | null;
    metadata?: DodoMetadata;
}

type DodoEventData = DodoSubscriptionData | DodoPaymentData;

interface DodoWebhookEvent {
    business_id: string;
    type: string;
    timestamp: string;
    data: DodoEventData;
}

// ---------------------------------------------------------------------------
// Supabase admin client (service role — bypasses RLS for webhook operations)
// ---------------------------------------------------------------------------

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
    // 1. Extract Standard Webhooks headers
    const webhookId = request.headers.get("webhook-id");
    const webhookSignature = request.headers.get("webhook-signature");
    const webhookTimestamp = request.headers.get("webhook-timestamp");

    if (!webhookId || !webhookSignature || !webhookTimestamp) {
        return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
    }

    // 2. Read raw body for signature verification
    const payload = await request.text();

    // 3. Verify signature using standardwebhooks
    try {
        const wh = new Webhook(process.env.DODO_WEBHOOK_SECRET!);
        wh.verify(payload, {
            "webhook-id": webhookId,
            "webhook-signature": webhookSignature,
            "webhook-timestamp": webhookTimestamp,
        });
    } catch {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    // 4. Parse event
    let event: DodoWebhookEvent;
    try {
        event = JSON.parse(payload) as DodoWebhookEvent;
    } catch {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 5. Acknowledge immediately, then process
    // (we do processing inline but keep the handler fast)
    try {
        await dispatchEvent(event);
    } catch (err) {
        // Log but still return 200 so Dodo doesn't keep retrying
        console.error(`[webhook] Unhandled error for event ${event.type}:`, err);
    }

    return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------

async function dispatchEvent(event: DodoWebhookEvent) {
    const { type, data } = event;

    switch (type) {
        // Subscription lifecycle
        case "subscription.active":
            await handleSubscriptionActive(data as DodoSubscriptionData);
            break;
        case "subscription.renewed":
            await handleSubscriptionRenewed(data as DodoSubscriptionData);
            break;
        case "subscription.cancelled":
            await handleSubscriptionStatusChange(data as DodoSubscriptionData, "cancelled");
            break;
        case "subscription.expired":
            await handleSubscriptionStatusChange(data as DodoSubscriptionData, "expired");
            break;
        case "subscription.on_hold":
            await handleSubscriptionStatusChange(data as DodoSubscriptionData, "on_hold");
            break;
        case "subscription.failed":
            await handleSubscriptionStatusChange(data as DodoSubscriptionData, "failed");
            break;
        case "subscription.plan_changed":
            await handleSubscriptionPlanChanged(data as DodoSubscriptionData);
            break;
        case "subscription.updated":
            await handleSubscriptionUpdated(data as DodoSubscriptionData);
            break;

        // Payment events
        case "payment.succeeded":
        case "payment.processing":
            await handlePaymentSucceededOrProcessing(data as DodoPaymentData);
            break;
        case "payment.failed":
            await handlePaymentFailed(data as DodoPaymentData);
            break;
        case "payment.cancelled":
            await recordPayment(data as DodoPaymentData, "cancelled");
            break;

        default:
            console.log(`[webhook] Unhandled event type: ${type}`);
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcPeriodEnd(start: Date, billingCycle: string): Date {
    const end = new Date(start);
    if (billingCycle === "yearly") {
        end.setFullYear(end.getFullYear() + 1);
    } else {
        end.setMonth(end.getMonth() + 1);
    }
    return end;
}

/**
 * Deactivate all current active subscriptions for a user, then insert
 * a fresh active one. Using status-based deactivation instead of upsert
 * so that historical records are preserved.
 */
async function activateSubscription(params: {
    userId: string;
    planName: string;
    billingCycle: string;
    dodoSubscriptionId?: string;
    dodoCustomerId?: string;
    amountCents?: number;
    currency?: string;
    periodStart?: Date;
    periodEnd?: Date;
}) {
    const {
        userId,
        planName,
        billingCycle,
        dodoSubscriptionId,
        dodoCustomerId,
        amountCents,
        currency,
        periodStart: ps,
        periodEnd: pe,
    } = params;

    const now = new Date();
    const periodStart = ps ?? now;
    const periodEnd = pe ?? calcPeriodEnd(now, billingCycle);
    const amount = amountCents != null ? amountCents / 100 : undefined;

    // Deactivate any previously active subscription for this user
    await supabaseAdmin
        .from("user_subscriptions")
        .update({ status: "superseded", updated_at: now.toISOString() })
        .eq("user_id", userId)
        .eq("status", "active");

    // Insert the new active subscription
    const { error } = await supabaseAdmin.from("user_subscriptions").insert({
        user_id: userId,
        plan_name: planName,
        status: "active",
        dodo_subscription_id: dodoSubscriptionId ?? null,
        dodo_customer_id: dodoCustomerId ?? null,
        billing_cycle: billingCycle,
        amount: amount ?? 0,
        currency: currency ?? "USD",
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
    });

    if (error) {
        console.error("[webhook] activateSubscription insert error:", error);
    }

    // Mirror plan on user_profiles if the column exists
    await supabaseAdmin
        .from("user_profiles")
        .update({ subscription_plan: planName, dodo_customer_id: dodoCustomerId ?? null })
        .eq("id", userId);
}

// ---------------------------------------------------------------------------
// Subscription event handlers
// ---------------------------------------------------------------------------

async function handleSubscriptionActive(data: DodoSubscriptionData) {
    const meta = data.metadata ?? {};
    const userId = meta.user_id;
    const planName = meta.plan_name;
    const billingCycle = meta.billing_cycle ?? "monthly";

    if (!userId || !planName) {
        console.warn("[webhook] subscription.active missing metadata user_id/plan_name");
        return;
    }

    const periodStart = data.previous_billing_date
        ? new Date(data.previous_billing_date)
        : new Date();
    const periodEnd = data.next_billing_date
        ? new Date(data.next_billing_date)
        : calcPeriodEnd(periodStart, billingCycle);

    await activateSubscription({
        userId,
        planName,
        billingCycle,
        dodoSubscriptionId: data.subscription_id,
        dodoCustomerId: data.customer?.customer_id,
        amountCents: data.recurring_pre_tax_amount,
        currency: data.currency,
        periodStart,
        periodEnd,
    });

    console.log(`[webhook] subscription.active → user=${userId} plan=${planName}`);
}

async function handleSubscriptionRenewed(data: DodoSubscriptionData) {
    const { subscription_id, next_billing_date, previous_billing_date, recurring_pre_tax_amount, currency } = data;

    if (!subscription_id) return;

    // Determine billing cycle from the existing record
    const { data: existing } = await supabaseAdmin
        .from("user_subscriptions")
        .select("billing_cycle")
        .eq("dodo_subscription_id", subscription_id)
        .single();

    const billingCycle = existing?.billing_cycle ?? "monthly";
    const periodStart = previous_billing_date ? new Date(previous_billing_date) : new Date();
    const periodEnd = next_billing_date
        ? new Date(next_billing_date)
        : calcPeriodEnd(periodStart, billingCycle);

    const updates: Record<string, unknown> = {
        status: "active",
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
    };
    if (recurring_pre_tax_amount != null) updates.amount = recurring_pre_tax_amount / 100;
    if (currency) updates.currency = currency;

    await supabaseAdmin
        .from("user_subscriptions")
        .update(updates)
        .eq("dodo_subscription_id", subscription_id);

    console.log(`[webhook] subscription.renewed → sub=${subscription_id}`);
}

async function handleSubscriptionStatusChange(
    data: DodoSubscriptionData,
    newStatus: string
) {
    const { subscription_id, cancelled_at } = data;
    if (!subscription_id) return;

    const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
    };

    if (newStatus === "cancelled") {
        updates.cancel_at_period_end = data.cancel_at_next_billing_date ?? true;
        updates.cancelled_at = cancelled_at ?? new Date().toISOString();
    }

    await supabaseAdmin
        .from("user_subscriptions")
        .update(updates)
        .eq("dodo_subscription_id", subscription_id);

    console.log(`[webhook] subscription.${newStatus} → sub=${subscription_id}`);
}

async function handleSubscriptionPlanChanged(data: DodoSubscriptionData) {
    const { subscription_id, metadata, recurring_pre_tax_amount, currency } = data;
    if (!subscription_id) return;

    const newPlanName = metadata?.plan_name;
    if (!newPlanName) {
        console.warn("[webhook] subscription.plan_changed missing metadata.plan_name");
        return;
    }

    const updates: Record<string, unknown> = {
        plan_name: newPlanName,
        updated_at: new Date().toISOString(),
    };
    if (recurring_pre_tax_amount != null) updates.amount = recurring_pre_tax_amount / 100;
    if (currency) updates.currency = currency;

    await supabaseAdmin
        .from("user_subscriptions")
        .update(updates)
        .eq("dodo_subscription_id", subscription_id);

    // Reflect on user_profiles
    const { data: sub } = await supabaseAdmin
        .from("user_subscriptions")
        .select("user_id")
        .eq("dodo_subscription_id", subscription_id)
        .single();

    if (sub?.user_id) {
        await supabaseAdmin
            .from("user_profiles")
            .update({ subscription_plan: newPlanName })
            .eq("id", sub.user_id);
    }

    console.log(`[webhook] subscription.plan_changed → sub=${subscription_id} newPlan=${newPlanName}`);
}

async function handleSubscriptionUpdated(data: DodoSubscriptionData) {
    const { subscription_id, status, next_billing_date, previous_billing_date, metadata } = data;
    if (!subscription_id) return;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (next_billing_date) updates.current_period_end = new Date(next_billing_date).toISOString();
    if (previous_billing_date) updates.current_period_start = new Date(previous_billing_date).toISOString();
    if (metadata?.plan_name) updates.plan_name = metadata.plan_name;

    await supabaseAdmin
        .from("user_subscriptions")
        .update(updates)
        .eq("dodo_subscription_id", subscription_id);

    console.log(`[webhook] subscription.updated → sub=${subscription_id}`);
}

// ---------------------------------------------------------------------------
// Payment event handlers
// ---------------------------------------------------------------------------

async function handlePaymentSucceededOrProcessing(data: DodoPaymentData) {
    // Always record in payment_history
    await recordPayment(data, "succeeded");

    // Only activate subscription when metadata carries user context
    const meta = data.metadata ?? {};
    const userId = meta.user_id;
    const planName = meta.plan_name;
    const billingCycle = meta.billing_cycle ?? "monthly";

    if (!userId || !planName) return; // one-time payment without subscription context

    // Check if subscription already active to avoid double-activation
    const { count } = await supabaseAdmin
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "active");

    if ((count ?? 0) === 0) {
        await activateSubscription({
            userId,
            planName,
            billingCycle,
            dodoSubscriptionId: data.subscription_id ?? undefined,
            dodoCustomerId: data.customer?.customer_id,
            amountCents: data.total_amount,
            currency: data.currency,
        });
        console.log(`[webhook] payment.succeeded → activated sub for user=${userId}`);
    }
}

async function handlePaymentFailed(data: DodoPaymentData) {
    await recordPayment(data, "failed");
    console.log(`[webhook] payment.failed → payment=${data.payment_id}`);
}

async function recordPayment(data: DodoPaymentData, status: string) {
    if (!data.payment_id) return;

    const meta = data.metadata ?? {};

    await supabaseAdmin
        .from("payment_history")
        .upsert(
            {
                user_id: meta.user_id ?? null,
                dodo_payment_id: data.payment_id,
                dodo_customer_id: data.customer?.customer_id ?? null,
                amount: (data.total_amount ?? 0) / 100,
                currency: data.currency ?? "USD",
                status,
                payment_method: data.payment_method ?? null,
                metadata: data.metadata ?? null,
            },
            { onConflict: "dodo_payment_id" }
        );
}
