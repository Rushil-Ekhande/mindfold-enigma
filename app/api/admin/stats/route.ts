// ============================================================================
// API: Admin — Dashboard stats and management
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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
 * Body: { therapist_id: string, status: "approved" | "rejected", rejection_reason?: string }
 */
export async function PATCH(request: NextRequest) {
    try {
        // Check if service role key is configured
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { error: "Admin access not configured" },
                { status: 500 }
            );
        }

        const supabase = createAdminClient();
        const body = await request.json();
        const { therapist_id, status, rejection_reason } = body;

        console.log("Updating therapist:", therapist_id, "to status:", status);

        if (!therapist_id || !status) {
            return NextResponse.json(
                { error: "Missing therapist_id or status" },
                { status: 400 }
            );
        }

        if (!["approved", "rejected"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status. Must be 'approved' or 'rejected'" },
                { status: 400 }
            );
        }

        if (status === "rejected" && !rejection_reason) {
            return NextResponse.json(
                { error: "Rejection reason is required when rejecting a therapist" },
                { status: 400 }
            );
        }

        // Get current therapist data
        const { data: currentTherapist } = await supabase
            .from("therapist_profiles")
            .select("rejection_count, government_id_url, degree_certificate_url")
            .eq("id", therapist_id)
            .single();

        if (!currentTherapist) {
            return NextResponse.json(
                { error: "Therapist not found" },
                { status: 404 }
            );
        }

        let updateData: any = { verification_status: status };

        if (status === "rejected") {
            const newRejectionCount = (currentTherapist.rejection_count || 0) + 1;
            const canResubmit = newRejectionCount < 3;

            updateData = {
                ...updateData,
                rejection_count: newRejectionCount,
                rejection_reason,
                last_rejection_date: new Date().toISOString(),
                can_resubmit: canResubmit,
                resubmission_requested: false,
            };

            // Store rejection history
            await supabase.from("therapist_rejection_history").insert({
                therapist_id,
                rejection_reason,
                old_government_id_url: currentTherapist.government_id_url,
                old_degree_certificate_url: currentTherapist.degree_certificate_url,
            });

            console.log(
                `Therapist rejected. Count: ${newRejectionCount}, Can resubmit: ${canResubmit}`
            );
        } else if (status === "approved") {
            // Reset rejection data on approval
            updateData = {
                ...updateData,
                rejection_reason: null,
                resubmission_requested: false,
            };
        }

        const { data, error } = await supabase
            .from("therapist_profiles")
            .update(updateData)
            .eq("id", therapist_id)
            .select();

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: "Therapist not found" },
                { status: 404 }
            );
        }

        console.log("Successfully updated therapist:", data);
        return NextResponse.json({ success: true, data: data[0] });
    } catch (error) {
        console.error("Error updating therapist status:", error);
        return NextResponse.json(
            { error: "Failed to update therapist status" },
            { status: 500 }
        );
    }
}
