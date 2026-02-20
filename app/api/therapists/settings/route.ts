// ============================================================================
// API: Therapist Settings — Fetch and update therapist profile/services
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/therapists/settings — Fetch therapist's own profile and services.
 */
export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch therapist profile
    const { data: profile } = await supabase
        .from("therapist_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch services
    const { data: services } = await supabase
        .from("therapist_services")
        .select("*")
        .eq("therapist_id", user.id)
        .order("created_at", { ascending: true });

    return NextResponse.json({
        ...profile,
        services: services || [],
    });
}

/**
 * PATCH /api/therapists/settings — Update therapist profile and services.
 * Body: { display_name, description, qualifications, services[] }
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

    // Update therapist profile
    await supabase
        .from("therapist_profiles")
        .update({
            display_name: body.display_name,
            description: body.description,
            qualifications: body.qualifications,
        })
        .eq("id", user.id);

    // Update services: delete existing and re-insert
    if (body.services && Array.isArray(body.services)) {
        // Delete existing services
        await supabase
            .from("therapist_services")
            .delete()
            .eq("therapist_id", user.id);

        // Insert new services
        if (body.services.length > 0) {
            const servicesToInsert = body.services.map(
                (s: { sessions_per_week: number; price_per_session: number; description: string }) => ({
                    therapist_id: user.id,
                    sessions_per_week: s.sessions_per_week,
                    price_per_session: s.price_per_session,
                    description: s.description,
                    is_active: true,
                })
            );
            await supabase.from("therapist_services").insert(servicesToInsert);
        }
    }

    return NextResponse.json({ success: true });
}
