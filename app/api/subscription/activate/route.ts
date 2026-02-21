import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { subscriptionId, planName, billingCycle } = await request.json();

        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        if (billingCycle === "yearly") {
            currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        } else {
            currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        }

        // Upsert the subscription as active immediately
        const { error: subError } = await supabaseAdmin
            .from("user_subscriptions")
            .upsert(
                {
                    user_id: user.id,
                    plan_name: planName ?? "basic",
                    status: "active",
                    dodo_subscription_id: subscriptionId ?? null,
                    current_period_start: currentPeriodStart.toISOString(),
                    current_period_end: currentPeriodEnd.toISOString(),
                    billing_cycle: billingCycle ?? "monthly",
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
            );

        if (subError) {
            console.error("Error activating subscription:", subError);
            return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 });
        }

        // Update user profile plan
        if (planName) {
            await supabaseAdmin
                .from("user_profiles")
                .update({ subscription_plan: planName })
                .eq("id", user.id);
        }

        console.log(`Subscription instantly activated for user ${user.id}, plan ${planName}`);
        return NextResponse.json({ success: true, plan: planName ?? "basic", status: "active" });
    } catch (error) {
        console.error("Activate subscription error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
