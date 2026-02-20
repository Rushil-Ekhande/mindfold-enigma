// ============================================================================
// API: Admin Transactions — Fetch all billing transactions
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { data: transactions } = await supabase
            .from("billing_transactions")
            .select(
                `
                id,
                amount,
                currency,
                description,
                transaction_type,
                status,
                created_at,
                profiles!billing_transactions_user_id_fkey(full_name, email)
            `
            )
            .order("created_at", { ascending: false });

        const formattedTransactions = transactions?.map((t: any) => ({
            id: t.id,
            user_name: t.profiles?.full_name || "Unknown",
            user_email: t.profiles?.email || "—",
            amount: Number(t.amount),
            currency: t.currency,
            transaction_type: t.transaction_type,
            status: t.status,
            description: t.description,
            created_at: t.created_at,
        })) || [];

        return NextResponse.json(formattedTransactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}
