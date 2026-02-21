import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_FEATURES = ["quick_reflect", "deep_reflect", "therapist_session"] as const;
type Feature = (typeof VALID_FEATURES)[number];

/**
 * POST /api/usage
 * Body: { feature: "quick_reflect" | "deep_reflect" | "therapist_session" }
 * Increments usage for the given feature. Returns 403 if limit is exceeded.
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const feature: unknown = body.feature;

        if (!feature || !VALID_FEATURES.includes(feature as Feature)) {
            return NextResponse.json(
                { error: `feature must be one of: ${VALID_FEATURES.join(", ")}` },
                { status: 400 }
            );
        }

        const { data: allowed, error } = await supabase.rpc("increment_usage", {
            p_user_id: user.id,
            p_feature: feature as Feature,
        });

        if (error) {
            console.error("[usage] increment_usage error:", error);
            return NextResponse.json({ error: "Failed to track usage" }, { status: 500 });
        }

        if (!allowed) {
            return NextResponse.json(
                { success: false, limitExceeded: true, error: "Usage limit reached" },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[usage] POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * GET /api/usage?feature=quick_reflect
 * Returns whether the authenticated user can use the given feature.
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const feature = new URL(request.url).searchParams.get("feature");

        if (!feature || !VALID_FEATURES.includes(feature as Feature)) {
            return NextResponse.json(
                { error: `feature must be one of: ${VALID_FEATURES.join(", ")}` },
                { status: 400 }
            );
        }

        const { data: canUse, error } = await supabase.rpc("can_use_feature", {
            p_user_id: user.id,
            p_feature: feature as Feature,
        });

        if (error) {
            console.error("[usage] can_use_feature error:", error);
            return NextResponse.json({ error: "Failed to check usage" }, { status: 500 });
        }

        return NextResponse.json({ canUse: Boolean(canUse), feature });
    } catch (error) {
        console.error("[usage] GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
