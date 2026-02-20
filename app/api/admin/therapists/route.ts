// ============================================================================
// API: Admin Therapists — Fetch all therapists with profile info
// ============================================================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/therapists — Fetch all therapist profiles (admin only).
 */
export async function GET() {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("therapist_profiles")
        .select(
            `
      *,
      profiles:id(full_name, email)
    `
        )
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
