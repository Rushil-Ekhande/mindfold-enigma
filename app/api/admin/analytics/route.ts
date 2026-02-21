// ============================================================================
// API: Admin Analytics — Comprehensive dashboard statistics
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        // Check if service role key is configured
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { error: "Admin access not configured" },
                { status: 500 }
            );
        }

        const supabase = createAdminClient();

        const searchParams = request.nextUrl.searchParams;
        const range = searchParams.get("range") || "30d";

        // Calculate date ranges for comparison
        const now = new Date();
        const daysAgo = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const previousPeriodStart = new Date(startDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        // Total counts with previous period comparison
        const { count: totalUsers } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "user");

        const { count: previousUsers } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "user")
            .lt("created_at", startDate.toISOString());

        const { count: totalTherapists } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "therapist");

        const { count: previousTherapists } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "therapist")
            .lt("created_at", startDate.toISOString());

        const { count: pendingVerifications } = await supabase
            .from("therapist_profiles")
            .select("*", { count: "exact", head: true })
            .eq("verification_status", "pending");

        const { count: totalEntries } = await supabase
            .from("journal_entries")
            .select("*", { count: "exact", head: true });

        const { count: previousEntries } = await supabase
            .from("journal_entries")
            .select("*", { count: "exact", head: true })
            .lt("entry_date", startDate.toISOString());

        // Revenue calculations with previous period
        const { data: currentTransactions } = await supabase
            .from("billing_transactions")
            .select("amount, transaction_type, status")
            .eq("status", "completed")
            .gte("created_at", startDate.toISOString());

        const { data: previousTransactions } = await supabase
            .from("billing_transactions")
            .select("amount, transaction_type, status")
            .eq("status", "completed")
            .gte("created_at", previousPeriodStart.toISOString())
            .lt("created_at", startDate.toISOString());

        const { data: allTransactions } = await supabase
            .from("billing_transactions")
            .select("amount, transaction_type, status")
            .eq("status", "completed");

        const totalRevenue = allTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const currentRevenue = currentTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const previousRevenue = previousTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        const subscriptionRevenue =
            allTransactions
                ?.filter((t) => t.transaction_type === "subscription")
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const currentSubRevenue =
            currentTransactions
                ?.filter((t) => t.transaction_type === "subscription")
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const previousSubRevenue =
            previousTransactions
                ?.filter((t) => t.transaction_type === "subscription")
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        const therapistEarnings =
            allTransactions
                ?.filter((t) => t.transaction_type === "therapist_payment")
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const currentTherapistEarnings =
            currentTransactions
                ?.filter((t) => t.transaction_type === "therapist_payment")
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const previousTherapistEarnings =
            previousTransactions
                ?.filter((t) => t.transaction_type === "therapist_payment")
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        // Active subscriptions (users with recent subscription transactions)
        const { data: recentSubs } = await supabase
            .from("billing_transactions")
            .select("user_id")
            .eq("transaction_type", "subscription")
            .eq("status", "completed")
            .gte("created_at", new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString());

        const { data: previousSubs } = await supabase
            .from("billing_transactions")
            .select("user_id")
            .eq("transaction_type", "subscription")
            .eq("status", "completed")
            .gte("created_at", new Date(previousPeriodStart.getTime()).toISOString())
            .lt("created_at", startDate.toISOString());

        const activeSubscriptions = new Set(recentSubs?.map((s) => s.user_id)).size;
        const previousActiveSubscriptions = new Set(previousSubs?.map((s) => s.user_id)).size;

        // Calculate percentage changes
        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const userChange = calculateChange(totalUsers || 0, previousUsers || 0);
        const therapistChange = calculateChange(totalTherapists || 0, previousTherapists || 0);
        const revenueChange = calculateChange(currentRevenue, previousRevenue);
        const subscriptionChange = calculateChange(activeSubscriptions, previousActiveSubscriptions);
        const entryChange = calculateChange((totalEntries || 0) - (previousEntries || 0), previousEntries || 0);
        const subRevenueChange = calculateChange(currentSubRevenue, previousSubRevenue);
        const therapistEarningsChange = calculateChange(currentTherapistEarnings, previousTherapistEarnings);

        // User growth over time
        const { data: userGrowthData } = await supabase
            .from("profiles")
            .select("created_at")
            .eq("role", "user")
            .gte("created_at", startDate.toISOString())
            .order("created_at");

        const userGrowth = generateTimeSeriesData(userGrowthData || [], daysAgo);

        // Revenue by month
        const { data: revenueData } = await supabase
            .from("billing_transactions")
            .select("amount, created_at")
            .eq("status", "completed")
            .gte("created_at", startDate.toISOString());

        const revenueByMonth = generateMonthlyRevenue(revenueData || [], daysAgo);

        // Top therapists by earnings
        const { data: therapistPayments } = await supabase
            .from("billing_transactions")
            .select(
                `
                amount,
                user_id,
                profiles!billing_transactions_user_id_fkey(full_name)
            `
            )
            .eq("transaction_type", "therapist_payment")
            .eq("status", "completed")
            .gte("created_at", startDate.toISOString());

        const therapistEarningsMap = new Map<string, { name: string; earnings: number; sessions: number }>();
        
        therapistPayments?.forEach((payment: any) => {
            const userId = payment.user_id;
            const name = payment.profiles?.full_name || "Unknown";
            const existing = therapistEarningsMap.get(userId) || { name, earnings: 0, sessions: 0 };
            existing.earnings += Number(payment.amount);
            existing.sessions += 1;
            therapistEarningsMap.set(userId, existing);
        });

        const topTherapists = Array.from(therapistEarningsMap.values())
            .sort((a, b) => b.earnings - a.earnings)
            .slice(0, 5);

        // Recent transactions
        const { data: recentTransactions } = await supabase
            .from("billing_transactions")
            .select(
                `
                id,
                amount,
                transaction_type,
                created_at,
                profiles!billing_transactions_user_id_fkey(full_name)
            `
            )
            .order("created_at", { ascending: false })
            .limit(10);

        const formattedTransactions = recentTransactions?.map((t: any) => ({
            id: t.id,
            user: t.profiles?.full_name || "Unknown",
            amount: Number(t.amount),
            type: t.transaction_type,
            date: t.created_at,
        })) || [];

        return NextResponse.json({
            totalUsers: totalUsers || 0,
            totalTherapists: totalTherapists || 0,
            pendingVerifications: pendingVerifications || 0,
            totalEntries: totalEntries || 0,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
            therapistEarnings: Math.round(therapistEarnings * 100) / 100,
            activeSubscriptions,
            userGrowth,
            revenueByMonth,
            topTherapists,
            recentTransactions: formattedTransactions,
            // Percentage changes
            changes: {
                users: userChange,
                therapists: therapistChange,
                revenue: revenueChange,
                subscriptions: subscriptionChange,
                entries: entryChange,
                subscriptionRevenue: subRevenueChange,
                therapistEarnings: therapistEarningsChange,
                pendingVerifications: 0, // This doesn't have a meaningful comparison
            },
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}

// Helper function to generate time series data
function generateTimeSeriesData(data: any[], days: number) {
    const result = [];
    const now = new Date();
    const interval = days <= 7 ? 1 : days <= 30 ? 5 : days <= 90 ? 15 : 30;
    
    for (let i = days; i >= 0; i -= interval) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const count = data.filter((d) => new Date(d.created_at) <= date).length;
        result.push({
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            count,
        });
    }
    
    return result;
}

// Helper function to generate monthly revenue
function generateMonthlyRevenue(data: any[], days: number) {
    const monthsToShow = days <= 30 ? 4 : days <= 90 ? 6 : 12;
    const result = [];
    const now = new Date();
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const amount = data
            .filter((d) => {
                const transDate = new Date(d.created_at);
                return transDate >= date && transDate < nextMonth;
            })
            .reduce((sum, d) => sum + Number(d.amount), 0);
        
        result.push({
            month: date.toLocaleDateString("en-US", { month: "short" }),
            amount: Math.round(amount * 100) / 100,
        });
    }
    
    return result;
}
