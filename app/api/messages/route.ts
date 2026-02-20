// ============================================================================
// API: Messages — Direct messaging between therapist and patient
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/messages?relationship_id=X — Fetch messages for a relationship.
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
    const relationshipId = searchParams.get("relationship_id");

    if (!relationshipId) {
        return NextResponse.json(
            { error: "relationship_id is required" },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("therapist_messages")
        .select("*")
        .eq("relationship_id", relationshipId)
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

/**
 * POST /api/messages — Send a message.
 * Body: { relationship_id, receiver_id, content }
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
    const { relationship_id, receiver_id, content } = body;

    if (!relationship_id || !receiver_id || !content) {
        return NextResponse.json(
            { error: "relationship_id, receiver_id, and content are required" },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("therapist_messages")
        .insert({
            relationship_id,
            sender_id: user.id,
            receiver_id,
            content,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
