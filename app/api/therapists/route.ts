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
    const search = (searchParams.get("search") || "").toLowerCase();

    // 1. Fetch approved therapist profiles
    const { data: therapistProfiles, error: tpError } = await supabase
        .from("therapist_profiles")
        .select("*")
        .eq("verification_status", "approved");

    if (tpError) {
        return NextResponse.json({ error: tpError.message }, { status: 500 });
    }

    if (!therapistProfiles || therapistProfiles.length === 0) {
        return NextResponse.json([]);
    }

    const therapistIds = therapistProfiles.map((t) => t.id);

    // 2. Fetch matching profiles (full_name, email)
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", therapistIds);

    // 3. Fetch services
    const { data: services } = await supabase
        .from("therapist_services")
        .select("*")
        .in("therapist_id", therapistIds);

    // 4. Fetch reviews (may be empty)
    const { data: reviews, error: reviewsError } = await supabase
        .from("therapist_reviews")
        .select("id, therapist_id, user_id, rating, review_text, created_at")
        .in("therapist_id", therapistIds);

    if (reviewsError) {
        console.error("Reviews fetch error:", reviewsError);
    }

    // Build lookup maps
    const profileMap = new Map(
        (profiles || []).map((p) => [p.id, { full_name: p.full_name, email: p.email }])
    );

    const serviceMap: Record<string, typeof services> = {};
    for (const s of services || []) {
        if (!serviceMap[s.therapist_id]) serviceMap[s.therapist_id] = [];
        serviceMap[s.therapist_id]!.push(s);
    }

    const reviewMap: Record<string, typeof reviews> = {};
    for (const r of reviews || []) {
        if (!reviewMap[r.therapist_id]) reviewMap[r.therapist_id] = [];
        reviewMap[r.therapist_id]!.push(r);
    }

    // Merge and filter
    let result = therapistProfiles.map((t) => ({
        ...t,
        profiles: profileMap.get(t.id) || { full_name: "", email: "" },
        therapist_services: serviceMap[t.id] || [],
        therapist_reviews: reviewMap[t.id] || [],
    }));

    if (search) {
        result = result.filter(
            (t) =>
                t.display_name?.toLowerCase().includes(search) ||
                t.description?.toLowerCase().includes(search) ||
                t.profiles.full_name?.toLowerCase().includes(search)
        );
    }

    return NextResponse.json(result);
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

    if (!therapist_id || !service_id) {
        return NextResponse.json(
            { error: "therapist_id and service_id are required" },
            { status: 400 }
        );
    }

    // Ensure user_profiles row exists (FK requires it — service role needed for INSERT)
    const { createAdminClient } = await import("@/lib/supabase/server");
    const adminSupabase = createAdminClient();
    await adminSupabase
        .from("user_profiles")
        .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });

    // Remove any old relationship records for this user+therapist to avoid unique constraint
    await adminSupabase
        .from("therapist_patients")
        .delete()
        .eq("therapist_id", therapist_id)
        .eq("user_id", user.id);

    // Create therapist-patient relationship
    const { data, error } = await adminSupabase
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
        console.error("therapist_patients insert error:", error);
        return NextResponse.json(
            { error: error.message, details: error.details, hint: error.hint },
            { status: 500 }
        );
    }

    // Update user's current therapist
    const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ current_therapist_id: therapist_id })
        .eq("id", user.id);

    if (updateError) {
        console.error("user_profiles update error:", updateError);
    }

    return NextResponse.json(data);
}
