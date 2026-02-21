import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch the most recent active subscription with plan details
        const { data: subscription, error: subError } = await supabase
            .from("user_subscriptions")
            .select(`*, subscription_plans(*)`)
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (subError) {
            console.error("Error fetching subscription:", subError);
            return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
        }

        if (!subscription) {
            return NextResponse.json({ hasSubscription: false, subscription: null, usage: null });
        }

        // Fetch active usage tracking for current period
        const { data: usage } = await supabase
            .from("usage_tracking")
            .select("*")
            .eq("user_id", user.id)
            .eq("subscription_id", subscription.id)
            .gte("period_end", new Date().toISOString())
            .maybeSingle();

        const plan = subscription.subscription_plans as Record<string, number> | null;

        const limits = {
            quick_reflect: {
                used: usage?.quick_reflect_used ?? 0,
                limit: plan?.quick_reflect_limit ?? 0,
                remaining: (plan?.quick_reflect_limit ?? 0) - (usage?.quick_reflect_used ?? 0),
            },
            deep_reflect: {
                used: usage?.deep_reflect_used ?? 0,
                limit: plan?.deep_reflect_limit ?? 0,
                remaining: (plan?.deep_reflect_limit ?? 0) - (usage?.deep_reflect_used ?? 0),
            },
            therapist_sessions: {
                used: usage?.therapist_sessions_used ?? 0,
                limit: plan?.therapist_sessions_per_week ?? 0,
                remaining: (plan?.therapist_sessions_per_week ?? 0) - (usage?.therapist_sessions_used ?? 0),
            },
        };

        return NextResponse.json({
            hasSubscription: true,
            subscription,
            plan,
            usage: usage ?? {
                quick_reflect_used: 0,
                deep_reflect_used: 0,
                therapist_sessions_used: 0,
            },
            limits,
        });
    } catch (error) {
        console.error("Subscription fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
