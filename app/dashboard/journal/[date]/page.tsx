// ============================================================================
// User Dashboard — Journal Entry Page (Dedicated Page for Single Entry)
// Users can only edit TODAY's entry, view-only for past
// ============================================================================

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    BookOpen,
    Brain,
    Smile,
    Target,
    Flame,
    AlertTriangle,
    Loader2,
    Lock,
} from "lucide-react";
import type { JournalEntry } from "@/lib/types";

export default function JournalEntryPage({
    params,
}: {
    params: Promise<{ date: string }>;
}) {
    const resolvedParams = use(params);
    const router = useRouter();
    const entryDate = resolvedParams.date;
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check if this is today's entry (local time)
    function getLocalDateString(date: Date) {
        return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
    }
    const todayLocal = getLocalDateString(new Date());
    const isToday = entryDate === todayLocal;
    const isPast = entryDate < todayLocal;
    const isFuture = entryDate > todayLocal;

    const MAX_CHARS = 2000;

    // Fetch existing entry
    useEffect(() => {
        async function fetchEntry() {
            setLoading(true);
            const res = await fetch(`/api/journal?date=${entryDate}`, { cache: "no-store" });
            const data = await res.json();
            const found = Array.isArray(data) ? data.find((e: JournalEntry) => e.entry_date === entryDate) : null;
            setEntry(found || null);
            setContent(found?.content || "");
            setLoading(false);
        }
        fetchEntry();
    }, [entryDate]);

    // Save/update journal entry (only if isToday)
    async function saveEntry() {
        if (!isToday || !content.trim()) return;
        setSaving(true);
        const res = await fetch("/api/journal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entry_date: entryDate, content }),
        });
        const data = await res.json();
        if (data.id) {
            setEntry(data);
            router.refresh();
        }
        setSaving(false);
    }

    // Parse entryDate as local date to avoid timezone issues
    function parseLocalDate(dateString: string) {
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day);
    }
    const formattedDate = parseLocalDate(entryDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="w-full">
            {/* Back Button */}
            <button
                onClick={() => router.push("/dashboard/journal")}
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors"
            >
                <ChevronLeft className="h-4 w-4" />
                Back to Calendar
            </button>

            {/* Header with Date */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{formattedDate}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        {isToday && (
                            <span className="text-xs font-medium bg-primary text-white px-2 py-1 rounded-full">
                                Today
                            </span>
                        )}
                        {isPast && !isToday && (
                            <span className="text-xs font-medium bg-muted-bg text-muted px-2 py-1 rounded-full flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Read Only
                            </span>
                        )}
                        {isFuture && (
                            <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-full">
                                Future Date
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Message for future dates */}
                    {isFuture && (
                        <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
                            <p className="text-sm text-accent font-medium">
                                ⏰ You can only write journal entries for today or past dates.
                            </p>
                        </div>
                    )}

                    {/* Editor (editable only if today, otherwise read-only or empty) */}
                    {!isFuture && (
                        <div className="bg-white rounded-xl border border-border p-6">
                            <textarea
                                value={content}
                                onChange={(e) => isToday && setContent(e.target.value.slice(0, MAX_CHARS))}
                                readOnly={!isToday}
                                placeholder={
                                    isToday
                                        ? "Write about your day... How are you feeling? What happened? What are you grateful for?"
                                        : isPast && !entry
                                            ? "No entry written for this day."
                                            : ""
                                }
                                className={`w-full h-96 px-4 py-3 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground ${!isToday ? "bg-muted-bg/30 cursor-not-allowed" : ""
                                    }`}
                            />
                            <div className="flex items-center justify-between mt-3">
                                <p className="text-xs text-muted">
                                    {content.length}/{MAX_CHARS} characters
                                </p>
                                {isToday && (
                                    <button
                                        onClick={saveEntry}
                                        disabled={saving || !content.trim()}
                                        className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {entry ? "Update Entry" : "Save Entry"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI Insights (only if entry exists) */}
                    {entry && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* AI Reflection */}
                            <div className="bg-white rounded-xl border border-border p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <h2 className="font-semibold text-foreground">AI Reflection</h2>
                                </div>
                                <p className="text-sm text-muted leading-relaxed">
                                    {entry.ai_reflection || "Save your entry to get an AI reflection."}
                                </p>
                            </div>

                            {/* Mental Metrics */}
                            <div className="bg-white rounded-xl border border-border p-6">
                                <h2 className="font-semibold text-foreground mb-4">Mental Metrics</h2>
                                <div className="space-y-4">
                                    {[
                                        {
                                            label: "Mental Health",
                                            value: entry.mental_health_score,
                                            icon: Brain,
                                            color: "bg-indigo-500",
                                        },
                                        {
                                            label: "Happiness",
                                            value: entry.happiness_score,
                                            icon: Smile,
                                            color: "bg-amber-500",
                                        },
                                        {
                                            label: "Accountability",
                                            value: entry.accountability_score,
                                            icon: Target,
                                            color: "bg-emerald-500",
                                        },
                                        {
                                            label: "Stress",
                                            value: entry.stress_score,
                                            icon: Flame,
                                            color: "bg-red-500",
                                        },
                                        {
                                            label: "Burnout Risk",
                                            value: entry.burnout_risk_score,
                                            icon: AlertTriangle,
                                            color: "bg-orange-500",
                                        },
                                    ].map((metric) => (
                                        <div key={metric.label}>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <div className="flex items-center gap-2">
                                                    <metric.icon className="h-4 w-4 text-muted" />
                                                    <span className="text-muted">{metric.label}</span>
                                                </div>
                                                <span className="font-semibold text-foreground">
                                                    {metric.value ?? "—"}/100
                                                </span>
                                            </div>
                                            <div className="h-2 bg-border rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${metric.color} rounded-full transition-all`}
                                                    style={{
                                                        width: `${metric.value ?? 0}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
