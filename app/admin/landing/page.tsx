// ============================================================================
// Admin Dashboard — Landing Page Management (Client Component)
// Edit landing page section content (JSONB data)
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import {
    FileEdit,
    Loader2,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Save,
} from "lucide-react";

interface LandingSection {
    id: string;
    section_name: string;
    content: Record<string, unknown>;
    display_order: number;
    is_active: boolean;
}

export default function AdminLandingPage() {
    const [sections, setSections] = useState<LandingSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        fetchSections();
    }, []);

    async function fetchSections() {
        setLoading(true);
        const res = await fetch("/api/admin/landing");
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);
        setLoading(false);
    }

    async function saveSection(section: LandingSection) {
        setSaving(true);
        setMessage("");
        const res = await fetch("/api/admin/landing", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                section_id: section.id,
                content: section.content,
                is_active: section.is_active,
            }),
        });
        if (res.ok) {
            setMessage(`"${section.section_name}" updated successfully!`);
            setTimeout(() => setMessage(""), 3000);
        }
        setSaving(false);
    }

    function updateSectionContent(sectionId: string, newContent: string) {
        try {
            const parsed = JSON.parse(newContent);
            setSections((prev) =>
                prev.map((s) =>
                    s.id === sectionId ? { ...s, content: parsed } : s
                )
            );
        } catch {
            // Invalid JSON — don't update
        }
    }

    function toggleActive(sectionId: string) {
        setSections((prev) =>
            prev.map((s) =>
                s.id === sectionId ? { ...s, is_active: !s.is_active } : s
            )
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-foreground mb-6">
                Landing Page Management
            </h1>

            {/* Status Message */}
            {message && (
                <div className="flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-3 rounded-lg mb-6">
                    <CheckCircle className="h-4 w-4" />
                    {message}
                </div>
            )}

            {sections.length === 0 ? (
                <div className="bg-white rounded-xl border border-border p-12 text-center">
                    <FileEdit className="h-12 w-12 text-muted/30 mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-1">No Sections</h3>
                    <p className="text-sm text-muted">
                        Landing page sections will appear here once created in the database.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            className="bg-white rounded-xl border border-border overflow-hidden"
                        >
                            {/* Section Header */}
                            <button
                                onClick={() =>
                                    setExpanded(expanded === section.id ? null : section.id)
                                }
                                className="w-full flex items-center justify-between p-5 hover:bg-muted-bg/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {expanded === section.id ? (
                                        <ChevronDown className="h-4 w-4 text-muted" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted" />
                                    )}
                                    <div className="text-left">
                                        <h3 className="font-semibold text-foreground">
                                            {section.section_name}
                                        </h3>
                                        <p className="text-xs text-muted">
                                            Order: {section.display_order}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${section.is_active
                                                ? "bg-success/10 text-success"
                                                : "bg-muted-bg text-muted"
                                            }`}
                                    >
                                        {section.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </button>

                            {/* Expanded Editor */}
                            {expanded === section.id && (
                                <div className="border-t border-border p-5">
                                    {/* Active Toggle */}
                                    <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={section.is_active}
                                            onChange={() => toggleActive(section.id)}
                                            className="w-4 h-4 accent-primary"
                                        />
                                        <span className="text-sm text-foreground">
                                            Section is active
                                        </span>
                                    </label>

                                    {/* JSON Editor */}
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Content (JSON)
                                    </label>
                                    <textarea
                                        value={JSON.stringify(section.content, null, 2)}
                                        onChange={(e) =>
                                            updateSectionContent(section.id, e.target.value)
                                        }
                                        className="w-full px-4 py-3 border border-border rounded-lg font-mono text-xs resize-none h-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-muted-bg/30"
                                        spellCheck={false}
                                    />

                                    {/* Save Button */}
                                    <button
                                        onClick={() => saveSection(section)}
                                        disabled={saving}
                                        className="mt-4 flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        Save Section
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
