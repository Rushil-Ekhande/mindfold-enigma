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

    const { data, error } = await supabase
        .from("therapist_patients")
        .select(
            `
      *,
      profiles:user_id(full_name, email)
    `
        )
        .eq("therapist_id", user.id)
        .eq("is_active", true);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
