// ============================================================================
// Admin Dashboard — Therapists Verification Page (Client Component)
// Review therapist documents, approve/reject verification
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import {
    ShieldCheck,
    ShieldX,
    Clock,
    FileText,
    ExternalLink,
    Loader2,
    User,
} from "lucide-react";

interface TherapistData {
    id: string;
    display_name: string | null;
    description: string | null;
    verification_status: string;
    government_id_url: string | null;
    degree_certificate_url: string | null;
    qualifications: string[] | null;
    created_at: string;
    profiles?: { full_name: string; email: string };
}

export default function AdminTherapistsPage() {
    const [therapists, setTherapists] = useState<TherapistData[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">(
        "pending"
    );

    useEffect(() => {
        fetchTherapists();
    }, []);

    async function fetchTherapists() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/therapists");
            if (!res.ok) {
                console.error("Failed to fetch therapists:", res.status);
                setTherapists([]);
                return;
            }
            const text = await res.text();
            if (!text) {
                console.error("Empty response from API");
                setTherapists([]);
                return;
            }
            const data = JSON.parse(text);
            setTherapists(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching therapists:", error);
            setTherapists([]);
        } finally {
            setLoading(false);
        }
    }

    async function updateVerification(
        therapistId: string,
        status: "approved" | "rejected"
    ) {
        setUpdating(therapistId);
        try {
            const res = await fetch("/api/admin/stats", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ therapist_id: therapistId, status }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Failed to update therapist:", data);
                alert(`Failed to ${status} therapist: ${data.error || "Unknown error"}`);
                setUpdating(null);
                return;
            }

            console.log("Successfully updated therapist:", data);
            
            // Refresh the list
            await fetchTherapists();
        } catch (error) {
            console.error("Error updating therapist:", error);
            alert(`Failed to ${status} therapist. Please try again.`);
        } finally {
            setUpdating(null);
        }
    }

    const filtered = therapists.filter(
        (t) => filter === "all" || t.verification_status === filter
    );

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
                Therapist Verification
            </h1>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab
                                ? "bg-primary text-white"
                                : "bg-white text-muted border border-border hover:bg-muted-bg/50"
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {tab === "pending" && (
                            <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                                {therapists.filter((t) => t.verification_status === "pending").length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Therapist Cards */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-border p-12 text-center">
                    <ShieldCheck className="h-12 w-12 text-muted/30 mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-1">
                        No {filter === "all" ? "" : filter} therapists
                    </h3>
                    <p className="text-sm text-muted">
                        {filter === "pending"
                            ? "All caught up! No pending verifications."
                            : "No therapists match this filter."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((therapist) => (
                        <div
                            key={therapist.id}
                            className="bg-white rounded-xl border border-border p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <User className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">
                                            {therapist.display_name ||
                                                therapist.profiles?.full_name ||
                                                "Unknown"}
                                        </h3>
                                        <p className="text-xs text-muted">
                                            {therapist.profiles?.email}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${therapist.verification_status === "approved"
                                            ? "bg-success/10 text-success"
                                            : therapist.verification_status === "pending"
                                                ? "bg-accent/10 text-accent"
                                                : "bg-danger/10 text-danger"
                                        }`}
                                >
                                    {therapist.verification_status === "approved" && (
                                        <ShieldCheck className="h-3 w-3 inline mr-1" />
                                    )}
                                    {therapist.verification_status === "pending" && (
                                        <Clock className="h-3 w-3 inline mr-1" />
                                    )}
                                    {therapist.verification_status === "rejected" && (
                                        <ShieldX className="h-3 w-3 inline mr-1" />
                                    )}
                                    {therapist.verification_status}
                                </span>
                            </div>

                            {/* Description */}
                            {therapist.description && (
                                <p className="text-sm text-muted mb-4">{therapist.description}</p>
                            )}

                            {/* Qualifications */}
                            {therapist.qualifications && therapist.qualifications.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-muted mb-1">
                                        Qualifications:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {therapist.qualifications.map((q, i) => (
                                            <span
                                                key={i}
                                                className="text-xs bg-muted-bg px-2 py-1 rounded-full text-foreground"
                                            >
                                                {q}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Documents */}
                            <div className="flex flex-wrap gap-3 mb-4">
                                {therapist.government_id_url && (
                                    <a
                                        href={therapist.government_id_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Government ID
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                                {therapist.degree_certificate_url && (
                                    <a
                                        href={therapist.degree_certificate_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Degree Certificate
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </div>

                            {/* Registered Date */}
                            <p className="text-xs text-muted mb-4">
                                Registered:{" "}
                                {new Date(therapist.created_at).toLocaleDateString()}
                            </p>

                            {/* Actions (only for pending) */}
                            {therapist.verification_status === "pending" && (
                                <div className="flex gap-2 pt-3 border-t border-border">
                                    <button
                                        onClick={() => updateVerification(therapist.id, "approved")}
                                        disabled={updating === therapist.id}
                                        className="flex items-center gap-1.5 bg-success text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                    >
                                        {updating === therapist.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="h-4 w-4" />
                                        )}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => updateVerification(therapist.id, "rejected")}
                                        disabled={updating === therapist.id}
                                        className="flex items-center gap-1.5 bg-danger text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                    >
                                        {updating === therapist.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ShieldX className="h-4 w-4" />
                                        )}
                                        Reject
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
