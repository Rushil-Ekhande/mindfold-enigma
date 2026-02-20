// ============================================================================
// API: Admin Users — Fetch all users with statistics
// ============================================================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        // Check if service role key is configured
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { error: "Admin access not configured. Please set SUPABASE_SERVICE_ROLE_KEY in .env" },
                { status: 500 }
            );
        }

        const supabase = createAdminClient();

        // Fetch all users with their profiles (exclude admin and therapist roles)
        const { data: users, error: usersError } = await supabase
            .from("profiles")
            .select("id, full_name, email, created_at, role")
            .not("role", "in", '("admin","therapist")')
            .order("created_at", { ascending: false });

        if (usersError) {
            console.error("Error fetching users:", usersError);
            return NextResponse.json({ error: usersError.message }, { status: 500 });
        }

        if (!users || users.length === 0) {
            console.log("No users found");
            return NextResponse.json([]);
        }

        console.log(`Found ${users.length} users`);

        // Fetch statistics for each user
        const usersWithStats = await Promise.all(
            users.map(async (u) => {
                // Get user profile for subscription info
                const { data: userProfile } = await supabase
                    .from("user_profiles")
                    .select("subscription_plan")
                    .eq("id", u.id)
                    .single();

                // Count journal entries (admin can only see count, not content)
                const { count: totalEntries } = await supabase
                    .from("journal_entries")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", u.id);

                // Get average mental health score (aggregated data only)
                const { data: entries } = await supabase
                    .from("journal_entries")
                    .select("mental_health_score")
                    .eq("user_id", u.id)
                    .not("mental_health_score", "is", null);

                const avgMentalHealth =
                    entries && entries.length > 0
                        ? entries.reduce((sum, e) => sum + (e.mental_health_score || 0), 0) /
                          entries.length
                        : 0;

                // Get last entry date (date only, not content)
                const { data: lastEntry } = await supabase
                    .from("journal_entries")
                    .select("created_at")
                    .eq("user_id", u.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                // Calculate total spent
                const { data: transactions } = await supabase
                    .from("billing_transactions")
                    .select("amount")
                    .eq("user_id", u.id)
                    .eq("status", "completed");

                const totalSpent =
                    transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

                return {
                    id: u.id,
                    full_name: u.full_name || "Unknown",
                    email: u.email || "No email",
                    created_at: u.created_at,
                    subscription_tier: userProfile?.subscription_plan || "basic",
                    total_entries: totalEntries || 0,
                    avg_mental_health: Math.round(avgMentalHealth * 10) / 10,
                    last_entry_date: lastEntry?.created_at || u.created_at,
                    total_spent: Math.round(totalSpent * 100) / 100,
                };
            })
        );

        return NextResponse.json(usersWithStats);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
