// ============================================================================
// API: Public Landing Page Content
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/landing — Fetch all active landing page sections (public).
 */
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("landing_page_sections")
            .select("*")
            .eq("is_active", true)
            .order("display_order");

        if (error) {
            console.error("Error fetching landing sections:", error);
            // Return empty array instead of error to prevent frontend crashes
            return NextResponse.json([]);
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error("Unexpected error in GET /api/landing:", error);
        return NextResponse.json([]);
    }
}
