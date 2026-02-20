// ============================================================================
// API: Session Notes — Create and fetch therapist notes
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/sessions/notes — Create session notes.
 * Body: { session_id, user_id, summary, doctors_notes, prescription, exercises }
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

    const { data, error } = await supabase
        .from("session_notes")
        .insert({
            session_id: body.session_id,
            therapist_id: user.id,
            user_id: body.user_id,
            summary: body.summary,
            doctors_notes: body.doctors_notes,
            prescription: body.prescription,
            exercises: body.exercises,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
