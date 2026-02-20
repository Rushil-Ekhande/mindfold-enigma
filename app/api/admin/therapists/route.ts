// ============================================================================
// API: Admin Therapists — Fetch all therapists with profile info
// ============================================================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/therapists — Fetch all therapist profiles (admin only).
 */
export async function GET() {
    try {
        // Check if service role key is configured
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
            return NextResponse.json(
                { error: "Admin access not configured. Please set SUPABASE_SERVICE_ROLE_KEY in .env" },
                { status: 500 }
            );
        }

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
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error("Unexpected error in GET /api/admin/therapists:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
