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
        const planName: string = body.planName ?? "basic";
        const billingCycle: string = body.billingCycle ?? "monthly";

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

        // Deactivate any existing active subscription for this user
        await supabaseAdmin
            .from("user_subscriptions")
            .update({ status: "superseded", updated_at: now.toISOString() })
            .eq("user_id", user.id)
            .eq("status", "active");

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
            return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 });
        }

        // Reflect plan on user_profiles (best-effort)
        await supabaseAdmin
            .from("user_profiles")
            .update({ subscription_plan: planName })
            .eq("id", user.id);

        return NextResponse.json({ success: true, plan: planName, status: "active" });
    } catch (error) {
        console.error("[activate] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
