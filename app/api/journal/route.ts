// ============================================================================
// API: Journal Entries — CRUD + AI Analysis
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeJournalEntry } from "@/lib/ai";

/**
 * GET /api/journal — Fetch journal entries for the current user.
 * Supports optional ?month=YYYY-MM or ?date=YYYY-MM-DD query parameters.
 */
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: YYYY-MM
    const date = searchParams.get("date"); // Format: YYYY-MM-DD

    let query = supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

    // Filter by specific date if provided
    if (date) {
        query = query.eq("entry_date", date);
    }
    // Filter by month if provided
    else if (month) {
        const [year, m] = month.split("-");
        const startDate = `${year}-${m}-01`;
        const endDate = new Date(parseInt(year), parseInt(m), 0)
            .toISOString()
            .split("T")[0];
        query = query.gte("entry_date", startDate).lte("entry_date", endDate);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

/**
 * POST /api/journal — Create or update a journal entry with AI analysis.
 * Body: { entry_date: string, content: string }
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entry_date, content } = body;

    if (!entry_date || !content) {
        return NextResponse.json(
            { error: "entry_date and content are required" },
            { status: 400 }
        );
    }

    // Run AI analysis on the journal entry
    const analysis = await analyzeJournalEntry(content);

    // Upsert the entry (create or update for this date)
    const { data, error } = await supabase
        .from("journal_entries")
        .upsert(
            {
                user_id: user.id,
                entry_date,
                content,
                ai_reflection: analysis.emotional_summary,
                mental_health_score: analysis.mental_health,
                happiness_score: analysis.happiness,
                accountability_score: analysis.accountability,
                stress_score: analysis.stress,
                burnout_risk_score: analysis.burnout_risk,
                mood: analysis.mood,
            },
            { onConflict: "user_id,entry_date" }
        )
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

/**
 * DELETE /api/journal — Delete all journal entries for the current user.
 */
export async function DELETE() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
