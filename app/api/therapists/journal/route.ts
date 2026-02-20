// ============================================================================
// API: Therapist Journal — View patient's shared journal entries
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/therapists/journal?user_id=X — Fetch visible journal entries for a patient.
 * Only returns entries where visible_to_therapist = true and there is an active relationship.
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
    const userId = searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json(
            { error: "user_id is required" },
            { status: 400 }
        );
    }

    // Verify active relationship exists (therapist can see own patients via RLS)
    const { data: relationship } = await supabase
        .from("therapist_patients")
        .select("id")
        .eq("therapist_id", user.id)
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

    if (!relationship) {
        return NextResponse.json(
            { error: "No active relationship with this patient" },
            { status: 403 }
        );
    }

    // Use admin client to bypass RLS on journal_entries (which only allows owner reads)
    // Authorization is enforced above via the relationship check
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .eq("visible_to_therapist", true)
        .order("entry_date", { ascending: false });

    if (error) {
        console.error("Therapist journal fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}
