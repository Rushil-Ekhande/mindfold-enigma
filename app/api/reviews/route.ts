// ============================================================================
// API: Reviews — Submit and fetch therapist reviews
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/reviews?therapist_id=X — Fetch reviews for a therapist.
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

    // Fetch reviews
    const { data: reviews, error } = await supabase
        .from("therapist_reviews")
        .select("id, therapist_id, user_id, rating, review_text, created_at")
        .eq("therapist_id", therapistId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Reviews GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch reviewer names separately to avoid FK hint issues
    if (reviews && reviews.length > 0) {
        const userIds = [...new Set(reviews.map((r) => r.user_id))];
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);

        const profileMap = new Map(
            (profiles || []).map((p) => [p.id, p.full_name])
        );

        const enriched = reviews.map((r) => ({
            ...r,
            profiles: { full_name: profileMap.get(r.user_id) || "Anonymous" },
        }));

        return NextResponse.json(enriched);
    }

    return NextResponse.json(reviews || []);
}

/**
 * POST /api/reviews — Submit a review for a therapist.
 * Body: { therapist_id, rating, review_text }
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
    const { therapist_id, rating, review_text } = body;

    if (!therapist_id || !rating) {
        return NextResponse.json(
            { error: "therapist_id and rating are required" },
            { status: 400 }
        );
    }

    // Use admin client to bypass RLS for upsert
    const adminSupabase = createAdminClient();

    // Upsert — one review per user per therapist
    const { data, error } = await adminSupabase
        .from("therapist_reviews")
        .upsert(
            {
                therapist_id,
                user_id: user.id,
                rating,
                review_text: review_text || null,
            },
            { onConflict: "therapist_id,user_id" }
        )
        .select()
        .single();

    if (error) {
        console.error("Review POST error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update therapist's average rating
    const { data: allReviews } = await adminSupabase
        .from("therapist_reviews")
        .select("rating")
        .eq("therapist_id", therapist_id);

    if (allReviews && allReviews.length > 0) {
        const avgRating =
            allReviews.reduce((sum, r) => sum + r.rating, 0) /
            allReviews.length;
        await adminSupabase
            .from("therapist_profiles")
            .update({ rating: parseFloat(avgRating.toFixed(2)) })
            .eq("id", therapist_id);
    }

    return NextResponse.json(data);
}
