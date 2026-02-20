// ============================================================================
// API: Journal Visibility — Toggle visible_to_therapist per entry
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/journal/visibility — Toggle visible_to_therapist on a journal entry.
 * Body: { entry_id: string, visible: boolean }
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
    const { entry_id, visible } = body;

    if (!entry_id || typeof visible !== "boolean") {
        return NextResponse.json(
            { error: "entry_id and visible (boolean) are required" },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("journal_entries")
        .update({ visible_to_therapist: visible })
        .eq("id", entry_id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
