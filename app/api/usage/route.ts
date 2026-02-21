import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { feature } = await request.json();

        if (!feature || !["quick_reflect", "deep_reflect", "therapist_session"].includes(feature)) {
            return NextResponse.json(
                { error: "Invalid feature type" },
                { status: 400 }
            );
        }

        // Call PostgreSQL function to check and increment usage
        const { data, error } = await supabase.rpc("increment_usage", {
            p_user_id: user.id,
            p_feature: feature,
        });

        if (error) {
            console.error("Usage tracking error:", error);
            return NextResponse.json(
                { error: "Failed to track usage" },
                { status: 500 }
            );
        }

        if (!data) {
            // Usage limit exceeded
            return NextResponse.json(
                {
                    success: false,
                    error: "Usage limit exceeded",
                    limitExceeded: true,
                },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Usage tracked successfully",
        });

    } catch (error) {
        console.error("Usage tracking error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const feature = searchParams.get("feature");

        if (!feature || !["quick_reflect", "deep_reflect", "therapist_session"].includes(feature)) {
            return NextResponse.json(
                { error: "Invalid feature type" },
                { status: 400 }
            );
        }

        // Call PostgreSQL function to check if user can use feature
        const { data, error } = await supabase.rpc("can_use_feature", {
            p_user_id: user.id,
            p_feature: feature,
        });

        if (error) {
            console.error("Usage check error:", error);
            return NextResponse.json(
                { error: "Failed to check usage" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            canUse: data,
            feature,
        });

    } catch (error) {
        console.error("Usage check error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
