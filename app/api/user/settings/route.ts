// ============================================================================
// API: User Settings — Profile updates, password change, account deletion
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/user/settings — Fetch user profile data.
 */
export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return NextResponse.json({
        ...profile,
        ...userProfile,
    });
}

/**
 * PATCH /api/user/settings — Update user profile name, password, or therapist access.
 * Body: { full_name?: string, password?: string, allow_therapist_access?: boolean }
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

    // Update therapist access settings if provided
    if (typeof body.allow_therapist_access === "boolean") {
        await supabase
            .from("user_profiles")
            .update({ allow_therapist_access: body.allow_therapist_access })
            .eq("id", user.id);
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
