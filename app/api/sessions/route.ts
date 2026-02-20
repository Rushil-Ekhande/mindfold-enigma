// ============================================================================
// API: Sessions — Request and manage therapy sessions
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/sessions — Fetch sessions for the current user or therapist.
 */
export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine role to decide which sessions to show
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const column = profile?.role === "therapist" ? "therapist_id" : "user_id";

    const { data, error } = await supabase
        .from("session_requests")
        .select(
            `
      *,
      session_notes(*)
    `
        )
        .eq(column, user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

/**
 * POST /api/sessions — Create a new session request.
 * Body: { relationship_id: string, therapist_id: string, user_notes?: string }
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
    const { relationship_id, therapist_id, user_notes } = body;

    const { data, error } = await supabase
        .from("session_requests")
        .insert({
            relationship_id,
            user_id: user.id,
            therapist_id,
            status: "requested",
            user_notes,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

/**
 * PATCH /api/sessions — Update session status (therapist actions).
 * Body: { session_id: string, status: string, meeting_link?: string, scheduled_date?: string }
 */
export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { session_id, status, meeting_link, scheduled_date } = body;

    const updateData: Record<string, unknown> = { status };
    if (meeting_link) updateData.meeting_link = meeting_link;
    if (scheduled_date) updateData.scheduled_date = scheduled_date;

    const { data, error } = await supabase
        .from("session_requests")
        .update(updateData)
        .eq("id", session_id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
