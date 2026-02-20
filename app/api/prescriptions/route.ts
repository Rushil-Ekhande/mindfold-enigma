// ============================================================================
// API: Prescriptions — CRUD for prescriptions & preventive measures
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/prescriptions?user_id=X — Fetch prescriptions for a patient.
 * Works for both therapists fetching their patient's data and users fetching their own.
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
    const userId = searchParams.get("user_id") || user.id;

    const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

/**
 * POST /api/prescriptions — Create a prescription or preventive measure.
 * Body: { user_id, relationship_id, type, title, content }
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
    const { user_id, relationship_id, type, title, content } = body;

    if (!user_id || !relationship_id || !type || !title || !content) {
        return NextResponse.json(
            { error: "user_id, relationship_id, type, title, and content are required" },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("prescriptions")
        .insert({
            therapist_id: user.id,
            user_id,
            relationship_id,
            type,
            title,
            content,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
