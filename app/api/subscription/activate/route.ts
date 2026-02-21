import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client for writes that bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        // Authenticate the calling user
        const supabase = await createServerClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const subscriptionId: string | null = body.subscriptionId ?? null;
        let planName: string = body.planName ?? null;
        const billingCycle: string = body.billingCycle ?? "monthly";

        // If no planName provided but we have subscriptionId, try to fetch from Dodo
        if (!planName && subscriptionId) {
            try {
                const dodoUrl = process.env.DODO_PAYMENTS_ENVIRONMENT === "test_mode"
                    ? "https://test.dodopayments.com"
                    : "https://live.dodopayments.com";

                const dodoRes = await fetch(`${dodoUrl}/subscriptions/${subscriptionId}`, {
                    headers: {
                        Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
                    },
                });

                if (dodoRes.ok) {
                    const dodoData = await dodoRes.json();
                    planName = dodoData.metadata?.plan_name ?? "basic";
                    console.log(`[activate] Fetched plan from Dodo: ${planName}`);
                } else {
                    planName = "basic";
                    console.warn("[activate] Failed to fetch subscription from Dodo, defaulting to basic");
                }
            } catch (err) {
                console.error("[activate] Error fetching from Dodo:", err);
                planName = "basic";
            }
        } else if (!planName) {
            planName = "basic";
        }

        // Look up plan price so we always have a valid amount
        const { data: plan } = await supabaseAdmin
            .from("subscription_plans")
            .select("price_monthly, price_yearly")
            .eq("plan_name", planName)
            .maybeSingle();

        const amount =
            billingCycle === "yearly"
                ? (plan?.price_yearly ?? 0)
                : (plan?.price_monthly ?? 0);

        const now = new Date();
        const periodStart = now;
        const periodEnd = new Date(now);
        if (billingCycle === "yearly") {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Check if webhook already activated this subscription
        if (subscriptionId) {
            const { data: existing } = await supabaseAdmin
                .from("user_subscriptions")
                .select("*")
                .eq("dodo_subscription_id", subscriptionId)
                .eq("status", "active")
                .maybeSingle();

            if (existing) {
                console.log(`[activate] Subscription ${subscriptionId} already active via webhook`);
                return NextResponse.json({
                    success: true,
                    plan: existing.plan_name,
                    status: "active",
                    source: "webhook"
                });
            }
        }

        // Check if there's already an active subscription for this user
        const { data: currentSub } = await supabaseAdmin
            .from("user_subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

        // If there's an active sub with the same plan, just return success
        if (currentSub && currentSub.plan_name === planName) {
            console.log(`[activate] User ${user.id} already has active ${planName} plan`);
            return NextResponse.json({
                success: true,
                plan: planName,
                status: "active",
                source: "existing"
            });
        }

        // Deactivate any existing active subscription for this user
        if (currentSub) {
            await supabaseAdmin
                .from("user_subscriptions")
                .update({ status: "superseded", updated_at: now.toISOString() })
                .eq("id", currentSub.id);
        }

        // Insert the new active subscription
        const { error: insertError } = await supabaseAdmin
            .from("user_subscriptions")
            .insert({
                user_id: user.id,
                plan_name: planName,
                status: "active",
                dodo_subscription_id: subscriptionId,
                billing_cycle: billingCycle,
                amount,
                currency: "USD",
                current_period_start: periodStart.toISOString(),
                current_period_end: periodEnd.toISOString(),
            });

        if (insertError) {
            console.error("[activate] Insert error:", insertError);
            return NextResponse.json({ error: "Failed to activate subscription", details: insertError.message }, { status: 500 });
        }

        console.log(`[activate] Successfully activated ${planName} for user ${user.id}`);

        console.log(`[activate] Successfully activated ${planName} for user ${user.id}`);

        // Reflect plan on user_profiles (best-effort)
        await supabaseAdmin
            .from("user_profiles")
            .update({ subscription_plan: planName })
            .eq("id", user.id);

        return NextResponse.json({ success: true, plan: planName, status: "active", source: "manual" });
    } catch (error) {
        console.error("[activate] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
