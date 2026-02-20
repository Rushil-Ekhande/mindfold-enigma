// ============================================================================
// API: Chat Messages — Fetch messages for a conversation
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/chat/messages?conversation_id=xxx
 * Fetches all messages for a given conversation.
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
    const conversationId = searchParams.get("conversation_id");

    if (!conversationId) {
        return NextResponse.json(
            { error: "conversation_id is required" },
            { status: 400 }
        );
    }

    // Verify conversation belongs to user
    const { data: conv } = await supabase
        .from("journal_chat_conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

    if (!conv) {
        return NextResponse.json(
            { error: "Conversation not found" },
            { status: 404 }
        );
    }

    const { data, error } = await supabase
        .from("journal_chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
