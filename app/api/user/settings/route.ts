// ============================================================================
// API: User Settings — Profile updates, password change, account deletion
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/user/settings — Update user profile name or password.
 * Body: { full_name?: string, password?: string }
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

    // Update name if provided
    if (body.full_name) {
        await supabase
            .from("profiles")
            .update({ full_name: body.full_name })
            .eq("id", user.id);
    }

    // Update password if provided
    if (body.password) {
        const { error } = await supabase.auth.updateUser({
            password: body.password,
        });
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    }

    return NextResponse.json({ success: true });
}

/**
 * DELETE /api/user/settings — Delete user account.
 */
export async function DELETE() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all journal entries
    await supabase.from("journal_entries").delete().eq("user_id", user.id);

    // Delete all chat conversations (cascades to messages)
    await supabase
        .from("journal_chat_conversations")
        .delete()
        .eq("user_id", user.id);

    // Delete profile (cascades)
    await supabase.from("profiles").delete().eq("id", user.id);

    // Delete auth user
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
}
