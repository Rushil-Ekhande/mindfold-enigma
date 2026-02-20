// ============================================================================
// API: Admin User Detail — Fetch individual user with detailed statistics
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check if service role key is configured
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { error: "Admin access not configured" },
                { status: 500 }
            );
        }

        const supabase = createAdminClient();
        const { id: userId } = await params;

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email, created_at")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch user profile details
        const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("subscription_plan, subscription_start_date, subscription_end_date")
            .eq("id", userId)
            .single();

        // Count total entries (admin can only see count, not content)
        const { count: totalEntries } = await supabase
            .from("journal_entries")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

        // Get average scores (admin can see aggregated metrics, not individual entries)
        const { data: entries } = await supabase
            .from("journal_entries")
            .select(
                "mental_health_score, happiness_score, stress_score, burnout_risk_score"
            )
            .eq("user_id", userId);

        const avgMentalHealth =
            entries && entries.length > 0
                ? entries.reduce((sum, e) => sum + (e.mental_health_score || 0), 0) /
                  entries.length
                : 0;

        const avgHappiness =
            entries && entries.length > 0
                ? entries.reduce((sum, e) => sum + (e.happiness_score || 0), 0) /
                  entries.length
                : 0;

        const avgStress =
            entries && entries.length > 0
                ? entries.reduce((sum, e) => sum + (e.stress_score || 0), 0) / entries.length
                : 0;

        const avgBurnout =
            entries && entries.length > 0
                ? entries.reduce((sum, e) => sum + (e.burnout_risk_score || 0), 0) /
                  entries.length
                : 0;

        // Get recent transactions
        const { data: transactions } = await supabase
            .from("billing_transactions")
            .select("id, amount, transaction_type, created_at")
            .eq("user_id", userId)
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(10);

        const totalSpent =
            transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        const recentTransactions = transactions?.map((t) => ({
            id: t.id,
            amount: Number(t.amount),
            type: t.transaction_type,
            date: t.created_at,
        })) || [];

        return NextResponse.json({
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            created_at: profile.created_at,
            subscription_plan: userProfile?.subscription_plan || "basic",
            subscription_start_date: userProfile?.subscription_start_date || null,
            subscription_end_date: userProfile?.subscription_end_date || null,
            total_entries: totalEntries || 0,
            avg_mental_health: Math.round(avgMentalHealth * 10) / 10,
            avg_happiness: Math.round(avgHappiness * 10) / 10,
            avg_stress: Math.round(avgStress * 10) / 10,
            avg_burnout: Math.round(avgBurnout * 10) / 10,
            total_spent: Math.round(totalSpent * 100) / 100,
            recent_transactions: recentTransactions,
            entry_stats: [], // Can add entry count by date if needed
        });
    } catch (error) {
        console.error("Error fetching user details:", error);
        return NextResponse.json(
            { error: "Failed to fetch user details" },
            { status: 500 }
        );
    }
}
