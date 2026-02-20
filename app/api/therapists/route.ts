// ============================================================================
// API: Therapists — Search and manage therapist connections
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/therapists — Search for verified therapists.
 * Supports ?search=query for name/description matching.
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
    const search = searchParams.get("search") || "";

    let query = supabase
        .from("therapist_profiles")
        .select(
            `
      *,
      profiles!inner(full_name, email),
      therapist_services(*)
    `
        )
        .eq("verification_status", "approved");

    if (search) {
        query = query.or(
            `display_name.ilike.%${search}%,description.ilike.%${search}%`
        );
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

/**
 * POST /api/therapists — Subscribe to a therapist's service.
 * Body: { therapist_id: string, service_id: string }
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
    const { therapist_id, service_id } = body;

    // Create therapist-patient relationship
    const { data, error } = await supabase
        .from("therapist_patients")
        .insert({
            therapist_id,
            user_id: user.id,
            service_id,
            is_active: true,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update user's current therapist
    await supabase
        .from("user_profiles")
        .update({ current_therapist_id: therapist_id })
        .eq("id", user.id);

    return NextResponse.json(data);
}
