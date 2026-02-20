// ============================================================================
// User Dashboard — My Therapist Page (Client Component)
// Full tabbed interface: Chat, Sessions, Journal, Prescriptions, Review
// ============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search,
    Star,
    Calendar,
    FileText,
    ExternalLink,
    Loader2,
    UserCheck,
    Shield,
    ShieldOff,
    MessageCircle,
    Send,
    BookOpen,
    Eye,
    EyeOff,
    Pill,
    Heart,
    Video,
    ChevronLeft,
    X,
    UserX,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface TherapistData {
    id: string;
    display_name: string;
    description: string;
    photo_url: string | null;
    qualifications: string[];
    rating: number;
    total_patients: number;
    profiles: { full_name: string; email: string };
    therapist_services: {
        id: string;
        sessions_per_week: number;
        price_per_session: number;
        description: string;
    }[];
    therapist_reviews?: {
        id: string;
        rating: number;
        review_text: string | null;
        created_at: string;
        profiles?: { full_name: string };
    }[];
}

interface SessionData {
    id: string;
    status: string;
    scheduled_date: string | null;
    meeting_link: string | null;
    requested_date: string;
    relationship_id: string;
    therapist_id: string;
    session_notes: {
        summary: string | null;
        prescription: string | null;
        exercises: string | null;
    }[];
}

interface MessageData {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
}

interface JournalEntryData {
    id: string;
    entry_date: string;
    content: string;
    visible_to_therapist: boolean;
    mental_health_score: number | null;
}

interface PrescriptionData {
    id: string;
    type: "prescription" | "preventive_measure";
    title: string;
    content: string;
    created_at: string;
}

// ── Tabs ────────────────────────────────────────────────────────────────────

type TabKey = "chat" | "sessions" | "journal" | "prescriptions" | "review";

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "chat", label: "Chat", icon: <MessageCircle className="h-4 w-4" /> },
    { key: "sessions", label: "Sessions", icon: <Calendar className="h-4 w-4" /> },
    { key: "journal", label: "Journal", icon: <BookOpen className="h-4 w-4" /> },
    { key: "prescriptions", label: "Medications", icon: <Pill className="h-4 w-4" /> },
    { key: "review", label: "Review", icon: <Star className="h-4 w-4" /> },
];

// ── Main Component ──────────────────────────────────────────────────────────

export default function TherapistPage() {
    const [hasTherapist, setHasTherapist] = useState(false);
    const [therapists, setTherapists] = useState<TherapistData[]>([]);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [relationship, setRelationship] = useState<{
        id: string;
        therapist_id: string;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("chat");

    // Therapist detail modal
    const [detailTherapist, setDetailTherapist] = useState<TherapistData | null>(null);

    // Current user ID
    const [userId, setUserId] = useState<string | null>(null);

    // Fetch user info and check relationship
    const checkRelationship = useCallback(async () => {
        setLoading(true);

        // Get user profile
        const userRes = await fetch("/api/user/settings");
        const userData = await userRes.json();
        if (userData?.id) {
            setUserId(userData.id);
        }

        // Check for active therapist relationship first
        if (userData?.current_therapist_id) {
            const tpRes = await fetch(
                `/api/therapists/patients/relationship?therapist_id=${userData.current_therapist_id}`
            );
            if (tpRes.ok) {
                const tpData = await tpRes.json();
                if (tpData?.id && tpData?.is_active) {
                    setHasTherapist(true);
                    setRelationship({
                        id: tpData.id,
                        therapist_id: userData.current_therapist_id,
                    });

                    // Fetch sessions for this active relationship
                    const res = await fetch("/api/sessions");
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        // Only show sessions for the current active relationship
                        const activeSessions = data.filter(
                            (s: SessionData) => s.relationship_id === tpData.id
                        );
                        setSessions(activeSessions);
                    }

                    setLoading(false);
                    return;
                }
            }
        }

        // No active relationship found
        setHasTherapist(false);
        setRelationship(null);
        setSessions([]);
        setLoading(false);
    }, []);

    useEffect(() => {
        checkRelationship();
    }, [checkRelationship]);

    // Search therapists
    async function searchTherapists() {
        const res = await fetch(
            `/api/therapists?search=${encodeURIComponent(search)}`
        );
        const data = await res.json();
        setTherapists(Array.isArray(data) ? data : []);
    }

    useEffect(() => {
        if (!hasTherapist) {
            searchTherapists();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasTherapist]);

    // Subscribe to a therapist's service
    async function subscribeToService(therapistId: string, serviceId: string) {
        const res = await fetch("/api/therapists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                therapist_id: therapistId,
                service_id: serviceId,
            }),
        });
        const data = await res.json();
        if (data.id) {
            setRelationship({ id: data.id, therapist_id: therapistId });
            setHasTherapist(true);
            setDetailTherapist(null);
            await checkRelationship();
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    // ── Has Therapist View (Tabbed) ─────────────────────────────────────────

    if (hasTherapist && relationship) {
        async function unhireTherapist() {
            if (!relationship) return;
            if (
                !confirm(
                    "Are you sure you want to end the relationship with your therapist? This action cannot be undone."
                )
            )
                return;
            const res = await fetch("/api/therapists/unhire", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    relationship_id: relationship.id,
                }),
            });
            const result = await res.json();
            if (result.success) {
                setHasTherapist(false);
                setRelationship(null);
                setSessions([]);
                // Force reload to clear all cached state
                window.location.reload();
            } else {
                alert("Failed to end relationship: " + (result.error || "Unknown error"));
            }
        }

        return (
            <div className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-foreground">
                        My Therapist
                    </h1>
                    <button
                        onClick={unhireTherapist}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-danger border border-danger/30 hover:bg-danger/10 transition-colors"
                    >
                        <UserX className="h-4 w-4" />
                        End Relationship
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-white rounded-xl border border-border p-1 mb-6 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                activeTab === tab.key
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-muted hover:text-foreground hover:bg-muted-bg"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "chat" && (
                    <ChatTab
                        relationshipId={relationship.id}
                        receiverId={relationship.therapist_id}
                        userId={userId || ""}
                    />
                )}
                {activeTab === "sessions" && (
                    <SessionsTab
                        sessions={sessions}
                        relationship={relationship}
                        onRefresh={checkRelationship}
                    />
                )}
                {activeTab === "journal" && <JournalTab />}
                {activeTab === "prescriptions" && <PrescriptionsTab />}
                {activeTab === "review" && (
                    <ReviewTab therapistId={relationship.therapist_id} />
                )}
            </div>
        );
    }

    // ── Search View (No Therapist) ──────────────────────────────────────────

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-foreground mb-6">
                Find a Therapist
            </h1>

            {/* Search Bar */}
            <div className="flex gap-3 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === "Enter" && searchTherapists()
                        }
                        placeholder="Search by name or specialization..."
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                </div>
                <button
                    onClick={searchTherapists}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-dark transition-colors"
                >
                    Search
                </button>
            </div>

            {/* Therapist Cards */}
            <div className="space-y-4">
                {therapists.length === 0 ? (
                    <div className="bg-white rounded-xl border border-border p-8 text-center text-muted">
                        No therapists found. Try adjusting your search.
                    </div>
                ) : (
                    therapists.map((therapist) => (
                        <div
                            key={therapist.id}
                            className="bg-white rounded-xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => setDetailTherapist(therapist)}
                        >
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                                    {(
                                        therapist.display_name ||
                                        therapist.profiles.full_name
                                    )
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-foreground">
                                            {therapist.display_name ||
                                                therapist.profiles.full_name}
                                        </h3>
                                        <div className="flex items-center gap-0.5">
                                            <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                                            <span className="text-xs text-muted">
                                                {therapist.therapist_reviews &&
                                                therapist.therapist_reviews.length > 0
                                                    ? (
                                                          therapist.therapist_reviews.reduce(
                                                              (sum, r) => sum + r.rating,
                                                              0
                                                          ) / therapist.therapist_reviews.length
                                                      ).toFixed(1)
                                                    : Number(therapist.rating).toFixed(1)}
                                            </span>
                                        </div>
                                        {therapist.therapist_reviews &&
                                            therapist.therapist_reviews.length > 0 && (
                                                <span className="text-xs text-muted">
                                                    ({therapist.therapist_reviews.length}{" "}
                                                    {therapist.therapist_reviews.length === 1
                                                        ? "review"
                                                        : "reviews"})
                                                </span>
                                            )}
                                    </div>
                                    <p className="text-sm text-muted mt-1">
                                        {therapist.description ||
                                            "Licensed mental health professional"}
                                    </p>

                                    {/* Qualifications */}
                                    {therapist.qualifications?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {therapist.qualifications.map((q, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs bg-primary/5 text-primary px-2 py-0.5 rounded-full"
                                                >
                                                    {q}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick pricing */}
                                    {therapist.therapist_services?.length > 0 && (
                                        <p className="text-xs text-muted mt-2">
                                            From $
                                            {Math.min(
                                                ...therapist.therapist_services.map(
                                                    (s) => s.price_per_session
                                                )
                                            )}
                                            /session · Click for details
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Therapist Detail Modal ──────────────────────────────────────── */}
            {detailTherapist && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">
                                {detailTherapist.display_name ||
                                    detailTherapist.profiles.full_name}
                            </h2>
                            <button
                                onClick={() => setDetailTherapist(null)}
                                className="p-2 rounded-lg hover:bg-muted-bg transition-colors"
                            >
                                <X className="h-5 w-5 text-muted" />
                            </button>
                        </div>

                        {/* Profile Info */}
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
                                {(
                                    detailTherapist.display_name ||
                                    detailTherapist.profiles.full_name
                                )
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex items-center gap-0.5">
                                        {(() => {
                                            const reviews = detailTherapist.therapist_reviews || [];
                                            const avgRating = reviews.length > 0
                                                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                                                : Number(detailTherapist.rating);
                                            return [1, 2, 3, 4, 5].map((s) => (
                                                <Star
                                                    key={s}
                                                    className={`h-4 w-4 ${
                                                        s <= Math.round(avgRating)
                                                            ? "text-accent fill-accent"
                                                            : "text-border"
                                                    }`}
                                                />
                                            ));
                                        })()}
                                    </div>
                                    <span className="text-sm text-muted">
                                        {(() => {
                                            const reviews = detailTherapist.therapist_reviews || [];
                                            const avgRating = reviews.length > 0
                                                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                                                : Number(detailTherapist.rating);
                                            return avgRating.toFixed(1);
                                        })()}
                                        {detailTherapist.therapist_reviews &&
                                        detailTherapist.therapist_reviews.length > 0
                                            ? ` · ${detailTherapist.therapist_reviews.length} ${
                                                  detailTherapist.therapist_reviews.length === 1
                                                      ? "review"
                                                      : "reviews"
                                              }`
                                            : detailTherapist.total_patients > 0
                                            ? ` · ${detailTherapist.total_patients} patients`
                                            : ""}
                                    </span>
                                </div>
                                <p className="text-sm text-muted">
                                    {detailTherapist.description}
                                </p>
                            </div>
                        </div>

                        {/* Qualifications */}
                        {detailTherapist.qualifications?.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-foreground mb-2">
                                    Qualifications
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {detailTherapist.qualifications.map((q, i) => (
                                        <span
                                            key={i}
                                            className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full"
                                        >
                                            {q}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Services */}
                        {detailTherapist.therapist_services?.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-foreground mb-2">
                                    Available Plans
                                </h3>
                                <div className="space-y-2">
                                    {detailTherapist.therapist_services.map((service) => (
                                        <div
                                            key={service.id}
                                            className="flex items-center justify-between bg-muted-bg/50 rounded-lg px-4 py-3"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {service.sessions_per_week} session(s)/week
                                                </p>
                                                <p className="text-xs text-muted">
                                                    {service.description || "Standard therapy sessions"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-foreground">
                                                    ${service.price_per_session}/session
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        subscribeToService(
                                                            detailTherapist.id,
                                                            service.id
                                                        )
                                                    }
                                                    className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                                                >
                                                    Choose
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        {detailTherapist.therapist_reviews &&
                            detailTherapist.therapist_reviews.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-2">
                                        Reviews ({detailTherapist.therapist_reviews.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {detailTherapist.therapist_reviews.map((review) => (
                                            <div
                                                key={review.id}
                                                className="bg-muted-bg/50 rounded-lg p-3"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="flex items-center">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star
                                                                key={s}
                                                                className={`h-3 w-3 ${
                                                                    s <= review.rating
                                                                        ? "text-accent fill-accent"
                                                                        : "text-border"
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-muted">
                                                        {review.profiles?.full_name || "Anonymous"}
                                                    </span>
                                                </div>
                                                {review.review_text && (
                                                    <p className="text-sm text-foreground">
                                                        {review.review_text}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// ── Chat Tab ────────────────────────────────────────────────────────────────

function ChatTab({
    relationshipId,
    receiverId,
    userId,
}: {
    relationshipId: string;
    receiverId: string;
    userId: string;
}) {
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchMessages = useCallback(async () => {
        const res = await fetch(
            `/api/messages?relationship_id=${relationshipId}`
        );
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
    }, [relationshipId]);

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 5 seconds
        pollRef.current = setInterval(fetchMessages, 5000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage() {
        if (!newMessage.trim()) return;
        setSending(true);

        await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                relationship_id: relationshipId,
                receiver_id: receiverId,
                content: newMessage.trim(),
            }),
        });

        setNewMessage("");
        await fetchMessages();
        setSending(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-border flex flex-col h-[600px]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted text-sm">
                        <div className="text-center">
                            <MessageCircle className="h-10 w-10 text-muted/30 mx-auto mb-2" />
                            <p>No messages yet. Start a conversation!</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMine = msg.sender_id === userId;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                                        isMine
                                            ? "bg-primary text-white rounded-br-md"
                                            : "bg-muted-bg text-foreground rounded-bl-md"
                                    }`}
                                >
                                    <p>{msg.content}</p>
                                    <p
                                        className={`text-[10px] mt-1 ${
                                            isMine
                                                ? "text-white/60"
                                                : "text-muted"
                                        }`}
                                    >
                                        {new Date(msg.created_at).toLocaleTimeString(
                                            [],
                                            { hour: "2-digit", minute: "2-digit" }
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Sessions Tab ────────────────────────────────────────────────────────────

function SessionsTab({
    sessions,
    relationship,
    onRefresh,
}: {
    sessions: SessionData[];
    relationship: { id: string; therapist_id: string };
    onRefresh: () => void;
}) {
    const [jitsiSessionId, setJitsiSessionId] = useState<string | null>(null);

    // Request a session (ping therapist)
    async function requestSession() {
        await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                relationship_id: relationship.id,
                therapist_id: relationship.therapist_id,
            }),
        });
        onRefresh();
    }

    return (
        <div>
            {/* Jitsi Live Session */}
            {jitsiSessionId && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Video className="h-5 w-5 text-primary" />
                            Live Session
                        </h2>
                        <button
                            onClick={() => setJitsiSessionId(null)}
                            className="text-sm text-muted hover:text-foreground transition-colors"
                        >
                            Close
                        </button>
                    </div>
                    <div className="bg-black rounded-xl overflow-hidden" style={{ height: "500px" }}>
                        <iframe
                            src={`https://meet.jit.si/mindfold-session-${jitsiSessionId}`}
                            style={{ width: "100%", height: "100%", border: 0 }}
                            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                            title="Jitsi Live Session"
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                    onClick={requestSession}
                    className="bg-white rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all text-left"
                >
                    <Calendar className="h-5 w-5 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground">
                        Request Session
                    </h3>
                    <p className="text-xs text-muted mt-1">
                        Send a session request to your therapist
                    </p>
                </button>

                <div className="bg-white rounded-xl border border-border p-5">
                    <UserCheck className="h-5 w-5 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground">Active</h3>
                    <p className="text-xs text-muted mt-1">
                        {sessions.length} session(s) recorded
                    </p>
                </div>
            </div>

            {/* Sessions List */}
            <h2 className="text-lg font-semibold text-foreground mb-4">
                Sessions
            </h2>
            <div className="space-y-3">
                {sessions.length === 0 ? (
                    <div className="bg-white rounded-xl border border-border p-8 text-center text-muted">
                        No sessions yet. Request one above!
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            className="bg-white rounded-xl border border-border p-5"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                        session.status === "completed"
                                            ? "bg-success/10 text-success"
                                            : session.status === "scheduled"
                                              ? "bg-primary/10 text-primary"
                                              : session.status === "requested"
                                                ? "bg-accent/10 text-accent"
                                                : "bg-muted-bg text-muted"
                                    }`}
                                >
                                    {session.status.charAt(0).toUpperCase() +
                                        session.status.slice(1)}
                                </span>
                                <span className="text-xs text-muted">
                                    {new Date(
                                        session.requested_date
                                    ).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Join meeting for scheduled sessions */}
                            {session.status === "scheduled" && (
                                <div className="flex gap-2 mb-3">
                                    {session.meeting_link && (
                                        <a
                                            href={session.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            External Link
                                        </a>
                                    )}
                                    <button
                                        onClick={() => setJitsiSessionId(session.id)}
                                        className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                                    >
                                        <Video className="h-3.5 w-3.5" />
                                        Join Live Session
                                    </button>
                                </div>
                            )}

                            {/* Session Notes */}
                            {session.session_notes?.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border space-y-2">
                                    {session.session_notes.map((note, i) => (
                                        <div key={i} className="space-y-2">
                                            {note.summary && (
                                                <div>
                                                    <p className="text-xs font-medium text-muted flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />{" "}
                                                        Summary
                                                    </p>
                                                    <p className="text-sm text-foreground">
                                                        {note.summary}
                                                    </p>
                                                </div>
                                            )}
                                            {note.prescription && (
                                                <div>
                                                    <p className="text-xs font-medium text-muted">
                                                        Medication
                                                    </p>
                                                    <p className="text-sm text-foreground">
                                                        {note.prescription}
                                                    </p>
                                                </div>
                                            )}
                                            {note.exercises && (
                                                <div>
                                                    <p className="text-xs font-medium text-muted">
                                                        Exercises
                                                    </p>
                                                    <p className="text-sm text-foreground">
                                                        {note.exercises}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ── Journal Tab ─────────────────────────────────────────────────────────────

function JournalTab() {
    const [entries, setEntries] = useState<JournalEntryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);
    const [allowAccess, setAllowAccess] = useState(true);

    useEffect(() => {
        async function fetchData() {
            // Fetch all journal entries
            const res = await fetch("/api/journal");
            const data = await res.json();
            setEntries(Array.isArray(data) ? data : []);
            setLoading(false);
        }
        fetchData();
    }, []);

    // Toggle visibility on individual entry
    async function toggleVisibility(entryId: string, currentVisible: boolean) {
        setToggling(entryId);
        await fetch("/api/journal/visibility", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                entry_id: entryId,
                visible: !currentVisible,
            }),
        });
        setEntries((prev) =>
            prev.map((e) =>
                e.id === entryId
                    ? { ...e, visible_to_therapist: !currentVisible }
                    : e
            )
        );
        setToggling(null);
    }

    // Toggle global access
    async function toggleGlobalAccess() {
        const newAccess = !allowAccess;
        setAllowAccess(newAccess);
        await fetch("/api/user/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ allow_therapist_access: newAccess }),
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div>
            {/* Global Access Toggle */}
            <div className="bg-white rounded-xl border border-border p-5 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {allowAccess ? (
                            <Shield className="h-5 w-5 text-success" />
                        ) : (
                            <ShieldOff className="h-5 w-5 text-danger" />
                        )}
                        <div>
                            <h3 className="font-semibold text-foreground">
                                Global Journal Access:{" "}
                                <span
                                    className={
                                        allowAccess
                                            ? "text-success"
                                            : "text-danger"
                                    }
                                >
                                    {allowAccess ? "ON" : "OFF"}
                                </span>
                            </h3>
                            <p className="text-xs text-muted">
                                {allowAccess
                                    ? "Your therapist can view entries you've shared"
                                    : "No entries are shared with your therapist"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggleGlobalAccess}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            allowAccess
                                ? "bg-danger/10 text-danger hover:bg-danger/20"
                                : "bg-success/10 text-success hover:bg-success/20"
                        }`}
                    >
                        {allowAccess ? "Disable" : "Enable"}
                    </button>
                </div>
            </div>

            {/* Per-entry visibility */}
            <h2 className="text-lg font-semibold text-foreground mb-4">
                Journal Entries — Sharing Settings
            </h2>
            <div className="space-y-2">
                {entries.length === 0 ? (
                    <div className="bg-white rounded-xl border border-border p-8 text-center text-muted">
                        No journal entries yet.
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div
                            key={entry.id}
                            className="bg-white rounded-xl border border-border p-4 flex items-center justify-between"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-foreground">
                                        {new Date(
                                            entry.entry_date
                                        ).toLocaleDateString("en-US", {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </span>
                                    {entry.mental_health_score !== null && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            {entry.mental_health_score}/100
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted truncate">
                                    {entry.content.slice(0, 100)}...
                                </p>
                            </div>
                            <button
                                onClick={() =>
                                    toggleVisibility(
                                        entry.id,
                                        entry.visible_to_therapist
                                    )
                                }
                                disabled={toggling === entry.id}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-4 ${
                                    entry.visible_to_therapist
                                        ? "bg-success/10 text-success hover:bg-success/20"
                                        : "bg-muted-bg text-muted hover:bg-border"
                                }`}
                            >
                                {toggling === entry.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : entry.visible_to_therapist ? (
                                    <Eye className="h-3 w-3" />
                                ) : (
                                    <EyeOff className="h-3 w-3" />
                                )}
                                {entry.visible_to_therapist
                                    ? "Shared"
                                    : "Hidden"}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ── Prescriptions Tab ───────────────────────────────────────────────────────

function PrescriptionsTab() {
    const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPrescriptions() {
            const res = await fetch("/api/prescriptions");
            const data = await res.json();
            setPrescriptions(Array.isArray(data) ? data : []);
            setLoading(false);
        }
        fetchPrescriptions();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
        );
    }

    const rxItems = prescriptions.filter((p) => p.type === "prescription");
    const preventive = prescriptions.filter(
        (p) => p.type === "preventive_measure"
    );

    return (
        <div>
            {/* Medications */}
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Medications
            </h2>
            {rxItems.length === 0 ? (
                <div className="bg-white rounded-xl border border-border p-8 text-center text-muted mb-8">
                    No medications yet.
                </div>
            ) : (
                <div className="space-y-3 mb-8">
                    {rxItems.map((rx) => (
                        <div
                            key={rx.id}
                            className="bg-white rounded-xl border border-border p-5"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-foreground">
                                    {rx.title}
                                </h3>
                                <span className="text-xs text-muted">
                                    {new Date(
                                        rx.created_at
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-muted">{rx.content}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Preventive Measures */}
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-success" />
                Preventive Measures
            </h2>
            {preventive.length === 0 ? (
                <div className="bg-white rounded-xl border border-border p-8 text-center text-muted">
                    No preventive measures yet.
                </div>
            ) : (
                <div className="space-y-3">
                    {preventive.map((pm) => (
                        <div
                            key={pm.id}
                            className="bg-white rounded-xl border border-border p-5"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-foreground">
                                    {pm.title}
                                </h3>
                                <span className="text-xs text-muted">
                                    {new Date(
                                        pm.created_at
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-muted">{pm.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Review Tab ──────────────────────────────────────────────────────────────

function ReviewTab({ therapistId }: { therapistId: string }) {
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [existingReviews, setExistingReviews] = useState<
        {
            id: string;
            rating: number;
            review_text: string | null;
            created_at: string;
            profiles?: { full_name: string };
        }[]
    >([]);
    const [hoverRating, setHoverRating] = useState(0);

    useEffect(() => {
        async function fetchReviews() {
            const res = await fetch(
                `/api/reviews?therapist_id=${therapistId}`
            );
            const data = await res.json();
            setExistingReviews(Array.isArray(data) ? data : []);
        }
        fetchReviews();
    }, [therapistId, submitted]);

    async function submitReview() {
        setSubmitting(true);
        await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                therapist_id: therapistId,
                rating,
                review_text: reviewText || null,
            }),
        });
        setSubmitting(false);
        setSubmitted(true);
        setReviewText("");
    }

    return (
        <div>
            {/* Submit Review */}
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    {submitted ? "Review Updated!" : "Rate Your Therapist"}
                </h2>

                {/* Star Rating */}
                <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <button
                            key={s}
                            onClick={() => setRating(s)}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-110"
                        >
                            <Star
                                className={`h-8 w-8 ${
                                    s <= (hoverRating || rating)
                                        ? "text-accent fill-accent"
                                        : "text-border"
                                }`}
                            />
                        </button>
                    ))}
                    <span className="text-sm text-muted ml-2">
                        {rating}/5
                    </span>
                </div>

                <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write a review (optional)..."
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors mb-4"
                />

                <button
                    onClick={submitReview}
                    disabled={submitting}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {submitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {submitted ? "Update Review" : "Submit Review"}
                </button>
            </div>

            {/* Existing Reviews */}
            {existingReviews.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                        All Reviews ({existingReviews.length})
                    </h2>
                    <div className="space-y-3">
                        {existingReviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-white rounded-xl border border-border p-4"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className={`h-3.5 w-3.5 ${
                                                    s <= review.rating
                                                        ? "text-accent fill-accent"
                                                        : "text-border"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-foreground">
                                        {review.profiles?.full_name ||
                                            "Anonymous"}
                                    </span>
                                    <span className="text-xs text-muted">
                                        {new Date(
                                            review.created_at
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                {review.review_text && (
                                    <p className="text-sm text-muted">
                                        {review.review_text}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
