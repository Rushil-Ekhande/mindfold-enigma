// ============================================================================
// API: Admin — Landing Page Content Management
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/landing — Fetch all landing page sections.
 */
export async function GET() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("landing_page_sections")
        .select("*")
        .order("section_name");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

/**
 * PATCH /api/admin/landing — Update a landing page section.
 * Body: { section_id: string, content: object, is_active: boolean }
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
    const { section_id, content, is_active } = body;

    const { error } = await supabase
        .from("landing_page_sections")
        .update({ content, is_active, updated_by: user.id })
        .eq("id", section_id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
