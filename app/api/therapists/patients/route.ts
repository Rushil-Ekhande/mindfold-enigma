// ============================================================================
// API: Therapist Patients — Fetch therapist's patients list
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/therapists/patients — Fetch all patients for the current therapist.
 */
export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch therapist-patient relationships
    const { data: relationships, error: relError } = await supabase
        .from("therapist_patients")
        .select("*")
        .eq("therapist_id", user.id)
        .eq("is_active", true);

    if (relError) {
        return NextResponse.json({ error: relError.message }, { status: 500 });
    }

    if (!relationships || relationships.length === 0) {
        return NextResponse.json([]);
    }

    // Fetch profile data for each patient (user_id references user_profiles which references profiles)
    const userIds = relationships.map((r) => r.user_id);
    const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

    if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Merge the data
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
    const result = relationships.map((rel) => ({
        ...rel,
        profiles: profileMap.get(rel.user_id) || null,
    }));

    return NextResponse.json(result);
}
