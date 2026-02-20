// ============================================================================
// API: Ask Journal — AI Chat with Journal Context
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askJournal } from "@/lib/ai";

/**
 * GET /api/chat — Fetch all conversations for the current user.
 */
export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("journal_chat_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

/**
 * POST /api/chat — Send a message in a conversation.
 * Body: { conversation_id?: string, message: string, chat_mode: string }
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
    const { conversation_id, message, chat_mode } = body;

    let convId = conversation_id;

    // Create new conversation if none provided
    if (!convId) {
        const { data: conv, error: convError } = await supabase
            .from("journal_chat_conversations")
            .insert({
                user_id: user.id,
                title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
                chat_mode: chat_mode || "quick_reflect",
            })
            .select()
            .single();

        if (convError) {
            return NextResponse.json({ error: convError.message }, { status: 500 });
        }
        convId = conv.id;
    }

    // Save user message
    await supabase.from("journal_chat_messages").insert({
        conversation_id: convId,
        role: "user",
        content: message,
    });

    // Fetch journal entries based on chat mode
    const mode = chat_mode || "quick_reflect";
    let entriesQuery = supabase
        .from("journal_entries")
        .select("entry_date, content")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

    if (mode === "quick_reflect") {
        // Last 2 weeks of entries
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        entriesQuery = entriesQuery.gte(
            "entry_date",
            twoWeeksAgo.toISOString().split("T")[0]
        );
    } else {
        // Deep reflect — all entries (limit to 100 for context window)
        entriesQuery = entriesQuery.limit(100);
    }

    const { data: entries } = await entriesQuery;

    // Check if there are any entries at all
    if (!entries || entries.length === 0) {
        // Only show "no entries" message if literally zero entries exist
        const aiResponse = "It looks like your journal entries are missing! To help you reflect, I'll need to read what you've written.\n\nPlease start journaling by going to the Journal page, and then I'll be able to give you personalized, thoughtful, and supportive answers to your questions.";

        // Save AI response
        await supabase.from("journal_chat_messages").insert({
            conversation_id: convId,
            role: "assistant",
            content: aiResponse,
        });

        // Update conversation timestamp
        await supabase
            .from("journal_chat_conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", convId);

        return NextResponse.json({
            conversation_id: convId,
            response: aiResponse,
        });
    }

    // Get AI response (will work with whatever entries are available)
    const aiResponse = await askJournal(
        message,
        entries,
        mode as "quick_reflect" | "deep_reflect"
    );

    // Save AI response
    await supabase.from("journal_chat_messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: aiResponse,
    });

    // Update conversation timestamp
    await supabase
        .from("journal_chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);

    return NextResponse.json({
        conversation_id: convId,
        response: aiResponse,
    });
}

/**
 * DELETE /api/chat — Delete a conversation.
 * Body: { conversation_id: string }
 */
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversation_id } = body;

    const { error } = await supabase
        .from("journal_chat_conversations")
        .delete()
        .eq("id", conversation_id)
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
