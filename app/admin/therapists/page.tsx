// ============================================================================
// Admin Dashboard — Therapists Verification Page (Client Component)
// Review therapist documents, approve/reject verification
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ShieldCheck,
    ShieldX,
    Clock,
    FileText,
    ExternalLink,
    Loader2,
    User,
    Stethoscope,
} from "lucide-react";
import { MorphingCardStack, type CardData } from "@/components/ui/morphing-card-stack";

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
    const router = useRouter();
    const [therapists, setTherapists] = useState<TherapistData[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">(
        "pending"
    );
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
    const [selectedCard, setSelectedCard] = useState<TherapistData | null>(null);

    useEffect(() => {
        fetchTherapists();
    }, []);

    async function fetchTherapists() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/therapists", { cache: "no-store" });
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
        status: "approved" | "rejected",
        reason?: string
    ) {
        setUpdating(therapistId);
        try {
            const body: any = { therapist_id: therapistId, status };
            if (status === "rejected" && reason) {
                body.rejection_reason = reason;
            }

            const res = await fetch("/api/admin/stats", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
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
            router.refresh(); // Invalidate route cache
            
            // Close dialog if open
            setShowRejectDialog(false);
            setSelectedTherapist(null);
            setRejectionReason("");
        } catch (error) {
            console.error("Error updating therapist:", error);
            alert(`Failed to ${status} therapist. Please try again.`);
        } finally {
            setUpdating(null);
        }
    }

    function handleRejectClick(therapistId: string) {
        setSelectedTherapist(therapistId);
        setShowRejectDialog(true);
    }

    function handleRejectSubmit() {
        if (!rejectionReason.trim()) {
            alert("Please provide a reason for rejection");
            return;
        }
        if (selectedTherapist) {
            updateVerification(selectedTherapist, "rejected", rejectionReason);
        }
    }

    const filtered = therapists.filter(
        (t) => filter === "all" || t.verification_status === filter
    );

    // Convert therapists to card data for morphing card stack
    const therapistCards: CardData[] = filtered.map((therapist) => {
        const registeredDate = new Date(therapist.created_at).toLocaleDateString();
        const statusBadge = therapist.verification_status === "approved"
            ? "✓ Approved"
            : therapist.verification_status === "pending"
                ? "⏳ Pending"
                : "✗ Rejected";
        
        const documents = [];
        if (therapist.government_id_url) {
            documents.push({ label: "Gov ID", url: therapist.government_id_url });
        }
        if (therapist.degree_certificate_url) {
            documents.push({ label: "Degree", url: therapist.degree_certificate_url });
        }

        const actions = therapist.verification_status === "pending" ? (
            <div className="flex gap-2 mt-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        updateVerification(therapist.id, "approved");
                    }}
                    disabled={updating === therapist.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                    {updating === therapist.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <ShieldCheck className="h-3 w-3" />
                    )}
                    Approve
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRejectClick(therapist.id);
                    }}
                    disabled={updating === therapist.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                    {updating === therapist.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <ShieldX className="h-3 w-3" />
                    )}
                    Reject
                </button>
            </div>
        ) : null;
        
        return {
            id: therapist.id,
            title: therapist.display_name || therapist.profiles?.full_name || "Unknown",
            description: `${therapist.profiles?.email || "No email"} • ${statusBadge} • ${registeredDate}`,
            icon: <User className="h-6 w-6 text-primary" />,
            metadata: {
                qualifications: therapist.qualifications || [],
                documents,
                actions,
            },
        };
    });

    function handleCardClick(card: CardData) {
        const therapist = filtered.find((t) => t.id === card.id);
        setSelectedCard(therapist || null);
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
                Therapist Verification
            </h1>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
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
                
                {/* View Mode Toggle */}
                <div className="ml-auto flex gap-2">
                    <button
                        onClick={() => setViewMode("cards")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "cards"
                                ? "bg-primary text-white"
                                : "bg-white text-muted border border-border hover:bg-muted-bg/50"
                            }`}
                    >
                        Cards
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "list"
                                ? "bg-primary text-white"
                                : "bg-white text-muted border border-border hover:bg-muted-bg/50"
                            }`}
                    >
                        List
                    </button>
                </div>
            </div>

            {/* Therapist Cards or List */}
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
            ) : viewMode === "cards" ? (
                <>
                    {/* Morphing Card Stack */}
                    <MorphingCardStack
                        cards={therapistCards}
                        defaultLayout="grid"
                        onCardClick={handleCardClick}
                        className="mb-6"
                    />
                    
                    {/* Selected Card Details */}
                    {selectedCard && (
                        <div className="bg-white rounded-xl border border-border p-6 mt-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <User className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">
                                            {selectedCard.display_name ||
                                                selectedCard.profiles?.full_name ||
                                                "Unknown"}
                                        </h3>
                                        <p className="text-xs text-muted">
                                            {selectedCard.profiles?.email}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${selectedCard.verification_status === "approved"
                                            ? "bg-success/10 text-success"
                                            : selectedCard.verification_status === "pending"
                                                ? "bg-accent/10 text-accent"
                                                : "bg-danger/10 text-danger"
                                        }`}
                                >
                                    {selectedCard.verification_status === "approved" && (
                                        <ShieldCheck className="h-3 w-3 inline mr-1" />
                                    )}
                                    {selectedCard.verification_status === "pending" && (
                                        <Clock className="h-3 w-3 inline mr-1" />
                                    )}
                                    {selectedCard.verification_status === "rejected" && (
                                        <ShieldX className="h-3 w-3 inline mr-1" />
                                    )}
                                    {selectedCard.verification_status}
                                </span>
                            </div>

                            {/* Description */}
                            {selectedCard.description && (
                                <p className="text-sm text-muted mb-4">{selectedCard.description}</p>
                            )}

                            {/* Qualifications */}
                            {selectedCard.qualifications && selectedCard.qualifications.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-muted mb-1">
                                        Qualifications:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedCard.qualifications.map((q, i) => (
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
                                {selectedCard.government_id_url && (
                                    <a
                                        href={selectedCard.government_id_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Government ID
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                                {selectedCard.degree_certificate_url && (
                                    <a
                                        href={selectedCard.degree_certificate_url}
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
                                {new Date(selectedCard.created_at).toLocaleDateString()}
                            </p>

                            {/* Actions (only for pending) */}
                            {selectedCard.verification_status === "pending" && (
                                <div className="flex gap-2 pt-3 border-t border-border">
                                    <button
                                        onClick={() => updateVerification(selectedCard.id, "approved")}
                                        disabled={updating === selectedCard.id}
                                        className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                    >
                                        {updating === selectedCard.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="h-4 w-4" />
                                        )}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleRejectClick(selectedCard.id)}
                                        disabled={updating === selectedCard.id}
                                        className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                                    >
                                        {updating === selectedCard.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ShieldX className="h-4 w-4" />
                                        )}
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </>
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
                                        className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                    >
                                        {updating === therapist.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="h-4 w-4" />
                                        )}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleRejectClick(therapist.id)}
                                        disabled={updating === therapist.id}
                                        className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
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

            {/* Rejection Dialog */}
            {showRejectDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Reject Therapist Application
                        </h3>
                        <p className="text-sm text-muted mb-4">
                            Please provide a detailed reason for rejection. The therapist will see this message.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., Documents are unclear, credentials need verification, etc."
                            className="w-full px-4 py-3 border border-border rounded-lg resize-none h-32 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectDialog(false);
                                    setSelectedTherapist(null);
                                    setRejectionReason("");
                                }}
                                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted-bg/50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={!rejectionReason.trim()}
                                className="flex-1 px-4 py-2.5 bg-danger text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
