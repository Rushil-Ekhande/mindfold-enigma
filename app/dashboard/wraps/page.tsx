// ============================================================================
// User Dashboard — Wraps Page (Server Component)
// Weekly and monthly mental health summaries ("Spotify Wrapped" for wellness)
// ============================================================================

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WrapsClient from "./WrapsClient";

export default async function WrapsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    // Fetch all journal entries with scores
    const { data: entries } = await supabase
        .from("journal_entries")
        .select(
            "id, entry_date, mental_health_score, happiness_score, accountability_score, stress_score, burnout_risk_score"
        )
        .eq("user_id", user.id)
        .not("mental_health_score", "is", null)
        .order("entry_date", { ascending: true });

    return <WrapsClient entries={entries || []} />;
}
