// ============================================================================
// API: Unhire Therapist — End therapist-patient relationship & clean up data
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/therapists/unhire — End the therapist-patient relationship.
 * Cleans up: sessions, session notes, messages, prescriptions, journal visibility.
 * Body: { relationship_id: string }
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
    const { relationship_id } = body;

    if (!relationship_id) {
        return NextResponse.json(
            { error: "relationship_id is required" },
            { status: 400 }
        );
    }

    const adminSupabase = createAdminClient();

    // Verify the relationship belongs to this user
    const { data: rel } = await adminSupabase
        .from("therapist_patients")
        .select("id, user_id, therapist_id")
        .eq("id", relationship_id)
        .eq("user_id", user.id)
        .single();

    if (!rel) {
        return NextResponse.json(
            { error: "Relationship not found" },
            { status: 404 }
        );
    }

    // 1. Delete session notes for sessions in this relationship
    const { data: sessions } = await adminSupabase
        .from("session_requests")
        .select("id")
        .eq("relationship_id", relationship_id);

    if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id);
        await adminSupabase
            .from("session_notes")
            .delete()
            .in("session_id", sessionIds);
    }

    // 2. Delete session requests for this relationship
    await adminSupabase
        .from("session_requests")
        .delete()
        .eq("relationship_id", relationship_id);

    // 3. Delete messages for this relationship
    await adminSupabase
        .from("therapist_messages")
        .delete()
        .eq("relationship_id", relationship_id);

    // 4. Delete prescriptions for this relationship
    await adminSupabase
        .from("prescriptions")
        .delete()
        .eq("relationship_id", relationship_id);

    // 5. Reset journal visibility for all user's entries
    await adminSupabase
        .from("journal_entries")
        .update({ visible_to_therapist: false })
        .eq("user_id", user.id);

    // 6. Reset global therapist access
    await adminSupabase
        .from("user_profiles")
        .update({
            current_therapist_id: null,
            allow_therapist_access: false,
        })
        .eq("id", user.id);

    // 7. Deactivate the relationship
    await adminSupabase
        .from("therapist_patients")
        .update({ is_active: false, end_date: new Date().toISOString() })
        .eq("id", relationship_id);

    return NextResponse.json({ success: true });
}
