// ============================================================================
// API: Admin — Dashboard stats and management
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/stats — Fetch platform-wide statistics.
 */
export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get counts
    const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "user");

    const { count: totalTherapists } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "therapist");

    const { count: pendingTherapists } = await supabase
        .from("therapist_profiles")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending");

    return NextResponse.json({
        total_users: totalUsers || 0,
        total_therapists: totalTherapists || 0,
        pending_therapists: pendingTherapists || 0,
    });
}

/**
 * PATCH /api/admin/stats — Update therapist verification status.
 * Body: { therapist_id: string, status: "approved" | "rejected" }
 */
export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { therapist_id, status } = body;

    const { error } = await supabase
        .from("therapist_profiles")
        .update({ verification_status: status })
        .eq("id", therapist_id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
