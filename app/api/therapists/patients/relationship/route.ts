// ============================================================================
// API: Therapist-Patient Relationship — Fetch active relationship for a user
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/therapists/patients/relationship?therapist_id=X
 * Fetch the active therapist_patients record for the current user.
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
    const therapistId = searchParams.get("therapist_id");

    if (!therapistId) {
        return NextResponse.json(
            { error: "therapist_id is required" },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("therapist_patients")
        .select("id, therapist_id, user_id, is_active")
        .eq("user_id", user.id)
        .eq("therapist_id", therapistId)
        .eq("is_active", true)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
}
