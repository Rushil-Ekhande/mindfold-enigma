// ============================================================================
// Supabase Browser Client
// Used in Client Components (hooks, event handlers, etc.)
// ============================================================================

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in browser/client components.
 * Reads public env vars for URL and anon key.
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
