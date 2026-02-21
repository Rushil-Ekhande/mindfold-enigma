// ============================================================================
// USAGE TRACKING INTEGRATION EXAMPLES
// Copy these patterns into your existing AI reflection and therapist features
// ============================================================================

// ============================================================================
// EXAMPLE 1: Quick Reflect Integration
// ============================================================================

"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export function QuickReflectComponent() {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [limitExceeded, setLimitExceeded] = useState(false);

    const handleQuickReflect = async () => {
        setLoading(true);
        setLimitExceeded(false);

        try {
            // ✅ STEP 1: Check if user can use the feature
            const checkResponse = await fetch("/api/usage?feature=quick_reflect");
            const { canUse } = await checkResponse.json();

            if (!canUse) {
                setLimitExceeded(true);
                setLoading(false);
                return;
            }

            // ✅ STEP 2: Process the quick reflect (your existing logic)
            const reflectionResponse = await fetch("/api/ai/quick-reflect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            if (!reflectionResponse.ok) {
                throw new Error("Failed to generate reflection");
            }

            const reflectionData = await reflectionResponse.json();

            // ✅ STEP 3: Increment usage counter after successful operation
            await fetch("/api/usage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feature: "quick_reflect" }),
            });

            // Display the reflection...
            console.log("Reflection:", reflectionData);

        } catch (error) {
            console.error("Quick reflect error:", error);
            alert("Failed to generate reflection. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-32 p-4 border rounded-lg"
            />

            {limitExceeded && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-red-800 font-medium">
                            Monthly limit reached
                        </p>
                        <p className="text-sm text-red-600">
                            You've used all your Quick Reflect requests this month.{" "}
                            <Link href="/pricing" className="underline font-semibold">
                                Upgrade your plan
                            </Link>{" "}
                            to get more.
                        </p>
                    </div>
                </div>
            )}

            <button
                onClick={handleQuickReflect}
                disabled={loading || !content.trim()}
                className="bg-primary text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Generating..." : "Quick Reflect"}
            </button>
        </div>
    );
}

// ============================================================================
// EXAMPLE 2: Deep Reflect Integration
// ============================================================================

export function DeepReflectComponent() {
    const [journalEntries, setJournalEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [limitExceeded, setLimitExceeded] = useState(false);

    const handleDeepReflect = async () => {
        setLoading(true);
        setLimitExceeded(false);

        try {
            // ✅ STEP 1: Check usage limit
            const checkResponse = await fetch("/api/usage?feature=deep_reflect");
            const { canUse } = await checkResponse.json();

            if (!canUse) {
                setLimitExceeded(true);
                setLoading(false);
                return;
            }

            // ✅ STEP 2: Process deep reflection (your existing logic)
            const reflectionResponse = await fetch("/api/ai/deep-reflect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entries: journalEntries }),
            });

            if (!reflectionResponse.ok) {
                throw new Error("Failed to generate deep reflection");
            }

            const reflectionData = await reflectionResponse.json();

            // ✅ STEP 3: Increment usage
            await fetch("/api/usage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feature: "deep_reflect" }),
            });

            // Display the reflection...
            console.log("Deep Reflection:", reflectionData);

        } catch (error) {
            console.error("Deep reflect error:", error);
            alert("Failed to generate deep reflection. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {limitExceeded && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-red-800 font-medium">
                            Monthly limit reached
                        </p>
                        <p className="text-sm text-red-600">
                            You've used all your Deep Reflect requests this month.{" "}
                            <Link href="/pricing" className="underline font-semibold">
                                Upgrade your plan
                            </Link>{" "}
                            for more insights.
                        </p>
                    </div>
                </div>
            )}

            <button
                onClick={handleDeepReflect}
                disabled={loading || journalEntries.length === 0}
                className="bg-primary text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Analyzing..." : "Deep Reflect"}
            </button>
        </div>
    );
}

// ============================================================================
// EXAMPLE 3: Therapist Session Booking Integration
// ============================================================================

export function TherapistSessionBooking({ therapistId }: { therapistId: string }) {
    const [selectedDate, setSelectedDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [limitExceeded, setLimitExceeded] = useState(false);

    const handleBookSession = async () => {
        setLoading(true);
        setLimitExceeded(false);

        try {
            // ✅ STEP 1: Check weekly session limit
            const checkResponse = await fetch("/api/usage?feature=therapist_session");
            const { canUse } = await checkResponse.json();

            if (!canUse) {
                setLimitExceeded(true);
                setLoading(false);
                return;
            }

            // ✅ STEP 2: Book the session (your existing logic)
            const bookingResponse = await fetch("/api/therapist/book-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    therapist_id: therapistId,
                    session_date: selectedDate,
                }),
            });

            if (!bookingResponse.ok) {
                throw new Error("Failed to book session");
            }

            const bookingData = await bookingResponse.json();

            // ✅ STEP 3: Increment usage after successful booking
            await fetch("/api/usage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feature: "therapist_session" }),
            });

            alert("Session booked successfully!");

        } catch (error) {
            console.error("Session booking error:", error);
            alert("Failed to book session. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <input
                type="datetime-local"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 border rounded-lg"
            />

            {limitExceeded && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-red-800 font-medium">
                            Weekly limit reached
                        </p>
                        <p className="text-sm text-red-600">
                            You've booked all your therapist sessions for this week.{" "}
                            <Link href="/pricing" className="underline font-semibold">
                                Upgrade your plan
                            </Link>{" "}
                            for more sessions.
                        </p>
                    </div>
                </div>
            )}

            <button
                onClick={handleBookSession}
                disabled={loading || !selectedDate}
                className="bg-primary text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Booking..." : "Book Session"}
            </button>
        </div>
    );
}

// ============================================================================
// EXAMPLE 4: Reusable Hook for Usage Tracking
// ============================================================================

import { useState, useCallback } from "react";

type FeatureType = "quick_reflect" | "deep_reflect" | "therapist_session";

export function useFeatureUsage(feature: FeatureType) {
    const [limitExceeded, setLimitExceeded] = useState(false);
    const [loading, setLoading] = useState(false);

    const checkAndUse = useCallback(
        async (action: () => Promise<void>) => {
            setLoading(true);
            setLimitExceeded(false);

            try {
                // Check usage limit
                const checkResponse = await fetch(`/api/usage?feature=${feature}`);
                const { canUse } = await checkResponse.json();

                if (!canUse) {
                    setLimitExceeded(true);
                    return false;
                }

                // Execute the action
                await action();

                // Increment usage
                await fetch("/api/usage", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ feature }),
                });

                return true;
            } catch (error) {
                console.error(`${feature} error:`, error);
                throw error;
            } finally {
                setLoading(false);
            }
        },
        [feature]
    );

    return { checkAndUse, limitExceeded, loading };
}

// Usage example:
export function ComponentWithHook() {
    const { checkAndUse, limitExceeded, loading } = useFeatureUsage("quick_reflect");

    const handleAction = async () => {
        const success = await checkAndUse(async () => {
            // Your feature logic here
            await fetch("/api/ai/quick-reflect", {
                method: "POST",
                body: JSON.stringify({ content: "..." }),
            });
        });

        if (success) {
            alert("Success!");
        }
    };

    return (
        <div>
            {limitExceeded && (
                <div className="text-red-600">
                    Limit exceeded.{" "}
                    <Link href="/pricing" className="underline">
                        Upgrade
                    </Link>
                </div>
            )}
            <button onClick={handleAction} disabled={loading}>
                {loading ? "Processing..." : "Use Feature"}
            </button>
        </div>
    );
}

// ============================================================================
// EXAMPLE 5: Server-Side Usage Check (for API routes)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Check usage limit server-side
    const { data: canUse } = await supabase.rpc("can_use_feature", {
        p_user_id: user.id,
        p_feature: "quick_reflect",
    });

    if (!canUse) {
        return NextResponse.json(
            { error: "Usage limit exceeded" },
            { status: 403 }
        );
    }

    // Process the request...

    // ✅ Increment usage
    await supabase.rpc("increment_usage", {
        p_user_id: user.id,
        p_feature: "quick_reflect",
    });

    return NextResponse.json({ success: true });
}

// ============================================================================
// BEST PRACTICES
// ============================================================================

/*
1. Always check usage BEFORE performing the action
2. Only increment usage AFTER successful completion
3. Show clear error messages with upgrade CTAs
4. Use loading states during checks
5. Handle errors gracefully
6. Consider using the reusable hook pattern
7. Implement server-side checks for security
8. Test all error paths (limit exceeded, network errors, etc.)
*/
