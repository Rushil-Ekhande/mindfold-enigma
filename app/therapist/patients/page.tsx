// ============================================================================
// Therapist Dashboard — Patients Page (Client Component)
// View patients, manage sessions, chat, view journal, write prescriptions
// ============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Users,
    Calendar,
    FileText,
    ExternalLink,
    Loader2,
    Check,
    Clock,
    X,
    ChevronLeft,
    MessageCircle,
    Send,
    BookOpen,
    Pill,
    Heart,
    Video,
    Plus,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface PatientData {
    id: string;
    user_id: string;
    is_active: boolean;
    profiles?: { full_name: string; email: string };
}

interface SessionData {
    id: string;
    user_id: string;
    status: string;
    requested_date: string;
    scheduled_date: string | null;
    meeting_link: string | null;
    user_notes: string | null;
    relationship_id: string;
    session_notes: {
        id: string;
        summary: string | null;
        doctors_notes: string | null;
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
    ai_reflection: string | null;
    mental_health_score: number | null;
    happiness_score: number | null;
    accountability_score: number | null;
    stress_score: number | null;
    burnout_risk_score: number | null;
}

interface PrescriptionData {
    id: string;
    type: "prescription" | "preventive_measure";
    title: string;
    content: string;
    created_at: string;
}

// ── Tab Types ───────────────────────────────────────────────────────────────

type TabKey = "chat" | "sessions" | "journal" | "prescriptions";

const patientTabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "chat", label: "Chat", icon: <MessageCircle className="h-4 w-4" /> },
    { key: "sessions", label: "Sessions", icon: <Calendar className="h-4 w-4" /> },
    { key: "journal", label: "Journal", icon: <BookOpen className="h-4 w-4" /> },
    { key: "prescriptions", label: "Medications", icon: <Pill className="h-4 w-4" /> },
];

// ── Main Component ──────────────────────────────────────────────────────────

export default function PatientsPage() {
    const [patients, setPatients] = useState<PatientData[]>([]);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>("chat");
    const [therapistId, setTherapistId] = useState<string | null>(null);

    // Fetch sessions (which contain patient info)
    const fetchSessions = useCallback(async () => {
        const res = await fetch("/api/sessions");
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
    }, []);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            // Get therapist ID
            const settingsRes = await fetch("/api/therapists/settings");
            const settingsData = await settingsRes.json();
            if (settingsData?.id) setTherapistId(settingsData.id);

            await fetchSessions();

            // Fetch patients
            const patientsRes = await fetch("/api/therapists/patients");
            const patientsData = await patientsRes.json();
            setPatients(Array.isArray(patientsData) ? patientsData : []);

            setLoading(false);
        }
        loadData();
    }, [fetchSessions]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    // ── Individual Patient View ─────────────────────────────────────────────

    if (selectedPatient) {
        const patientSessions = sessions.filter(
            (s) => s.user_id === selectedPatient.user_id
        );

        // Get relationship ID from the patient record
        const relationshipId = selectedPatient.id;

        return (
            <div className="w-full">
                <button
                    onClick={() => {
                        setSelectedPatient(null);
                        setActiveTab("chat");
                    }}
                    className="flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Patients
                </button>

                <h1 className="text-2xl font-bold text-foreground mb-6">
                    Patient: {selectedPatient.profiles?.full_name || "Unknown"}
                </h1>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-white rounded-xl border border-border p-1 mb-6 overflow-x-auto">
                    {patientTabs.map((tab) => (
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
                    <TherapistChatTab
                        relationshipId={relationshipId}
                        receiverId={selectedPatient.user_id}
                        therapistId={therapistId || ""}
                    />
                )}
                {activeTab === "sessions" && (
                    <TherapistSessionsTab
                        sessions={patientSessions}
                        patientUserId={selectedPatient.user_id}
                        relationshipId={relationshipId}
                        onRefresh={fetchSessions}
                    />
                )}
                {activeTab === "journal" && (
                    <TherapistJournalTab userId={selectedPatient.user_id} />
                )}
                {activeTab === "prescriptions" && (
                    <TherapistPrescriptionsTab
                        userId={selectedPatient.user_id}
                        relationshipId={relationshipId}
                    />
                )}
            </div>
        );
    }

    // ── Patient List View ───────────────────────────────────────────────────

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-foreground mb-6">Patients</h1>

            {patients.length === 0 ? (
                <div className="bg-white rounded-xl border border-border p-12 text-center">
                    <Users className="h-12 w-12 text-muted/30 mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-1">
                        No Patients Yet
                    </h3>
                    <p className="text-sm text-muted">
                        Patients will appear here once they subscribe to your
                        services.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patients.map((patient) => {
                        const patientSessions = sessions.filter(
                            (s) => s.user_id === patient.user_id
                        );
                        const pendingCount = patientSessions.filter(
                            (s) => s.status === "requested"
                        ).length;

                        return (
                            <button
                                key={patient.id}
                                onClick={() => setSelectedPatient(patient)}
                                className="bg-white rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                                        {(
                                            patient.profiles?.full_name || "?"
                                        ).charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">
                                            {patient.profiles?.full_name ||
                                                "Unknown Patient"}
                                        </h3>
                                        <p className="text-xs text-muted">
                                            {patient.profiles?.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="text-xs bg-muted-bg text-muted px-2 py-1 rounded-full">
                                        <Calendar className="h-3 w-3 inline mr-1" />
                                        {patientSessions.length} sessions
                                    </span>
                                    {pendingCount > 0 && (
                                        <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                                            {pendingCount} pending
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// THERAPIST TAB COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// ── Therapist Chat Tab ──────────────────────────────────────────────────────

function TherapistChatTab({
    relationshipId,
    receiverId,
    therapistId,
}: {
    relationshipId: string;
    receiverId: string;
    therapistId: string;
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
                        const isMine = msg.sender_id === therapistId;
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
                                        {new Date(
                                            msg.created_at
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <div className="border-t border-border p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === "Enter" && !e.shiftKey && sendMessage()
                        }
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

// ── Therapist Sessions Tab ──────────────────────────────────────────────────

function TherapistSessionsTab({
    sessions,
    patientUserId,
    relationshipId,
    onRefresh,
}: {
    sessions: SessionData[];
    patientUserId: string;
    relationshipId: string;
    onRefresh: () => void;
}) {
    const [meetingLink, setMeetingLink] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [jitsiSessionId, setJitsiSessionId] = useState<string | null>(null);

    // Notes form state
    const [notesForm, setNotesForm] = useState({
        session_id: "",
        user_id: "",
        summary: "",
        doctors_notes: "",
        prescription: "",
        exercises: "",
    });
    const [showNotesForm, setShowNotesForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Accept a session with auto-generated Jitsi link
    async function acceptSession(sessionId: string) {
        const jitsiLink = `https://meet.jit.si/mindfold-session-${sessionId}`;
        await fetch("/api/sessions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: sessionId,
                status: "scheduled",
                meeting_link: meetingLink || jitsiLink,
                scheduled_date: scheduledDate || new Date().toISOString(),
            }),
        });
        setMeetingLink("");
        setScheduledDate("");
        await onRefresh();
    }

    async function postponeSession(sessionId: string) {
        await fetch("/api/sessions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: sessionId,
                status: "postponed",
            }),
        });
        await onRefresh();
    }

    async function completeSession(sessionId: string) {
        await fetch("/api/sessions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: sessionId,
                status: "completed",
            }),
        });
        await onRefresh();
    }

    async function submitNotes() {
        setSaving(true);
        await fetch("/api/sessions/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notesForm),
        });
        setShowNotesForm(false);
        setNotesForm({
            session_id: "",
            user_id: "",
            summary: "",
            doctors_notes: "",
            prescription: "",
            exercises: "",
        });
        setSaving(false);
        await onRefresh();
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
                    <div
                        className="bg-black rounded-xl overflow-hidden"
                        style={{ height: "500px" }}
                    >
                        <iframe
                            src={`https://meet.jit.si/mindfold-session-${jitsiSessionId}`}
                            style={{
                                width: "100%",
                                height: "100%",
                                border: 0,
                            }}
                            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                            title="Jitsi Live Session"
                        />
                    </div>
                </div>
            )}

            {/* Sessions */}
            <div className="space-y-4">
                {sessions.length === 0 ? (
                    <div className="bg-white rounded-xl border border-border p-8 text-center text-muted">
                        No sessions with this patient yet.
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            className="bg-white rounded-xl border border-border p-5"
                        >
                            <div className="flex items-center justify-between mb-4">
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
                                    {session.status}
                                </span>
                                <span className="text-xs text-muted">
                                    {new Date(
                                        session.requested_date
                                    ).toLocaleDateString()}
                                </span>
                            </div>

                            {session.user_notes && (
                                <p className="text-sm text-muted mb-4 italic">
                                    Patient notes: {session.user_notes}
                                </p>
                            )}

                            {/* Actions for requested sessions */}
                            {session.status === "requested" && (
                                <div className="space-y-3 bg-muted-bg/50 rounded-lg p-4">
                                    <input
                                        type="text"
                                        value={meetingLink}
                                        onChange={(e) =>
                                            setMeetingLink(e.target.value)
                                        }
                                        placeholder="Custom meeting link (leave empty for Jitsi auto-link)"
                                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <input
                                        type="datetime-local"
                                        value={scheduledDate}
                                        onChange={(e) =>
                                            setScheduledDate(e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                acceptSession(session.id)
                                            }
                                            className="flex items-center gap-1.5 bg-success text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                                        >
                                            <Check className="h-4 w-4" />
                                            Accept & Schedule
                                        </button>
                                        <button
                                            onClick={() =>
                                                postponeSession(session.id)
                                            }
                                            className="flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                                        >
                                            <Clock className="h-4 w-4" />
                                            Postpone
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Actions for scheduled sessions */}
                            {session.status === "scheduled" && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            setJitsiSessionId(session.id)
                                        }
                                        className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                                    >
                                        <Video className="h-4 w-4" />
                                        Start Live Session
                                    </button>
                                    {session.meeting_link && (
                                        <a
                                            href={session.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 bg-white border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted-bg transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            External Link
                                        </a>
                                    )}
                                    <button
                                        onClick={() =>
                                            completeSession(session.id)
                                        }
                                        className="flex items-center gap-1.5 bg-success text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                                    >
                                        <Check className="h-4 w-4" />
                                        Mark Complete
                                    </button>
                                </div>
                            )}

                            {/* Write Notes Button */}
                            {(session.status === "completed" ||
                                session.status === "scheduled") && (
                                <button
                                    onClick={() => {
                                        setNotesForm({
                                            session_id: session.id,
                                            user_id: session.user_id,
                                            summary: "",
                                            doctors_notes: "",
                                            prescription: "",
                                            exercises: "",
                                        });
                                        setShowNotesForm(true);
                                    }}
                                    className="mt-3 flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                    <FileText className="h-4 w-4" />
                                    Write Session Notes
                                </button>
                            )}

                            {/* Existing Notes */}
                            {session.session_notes?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border space-y-2">
                                    <p className="text-xs font-medium text-muted">
                                        Session Notes:
                                    </p>
                                    {session.session_notes.map((note) => (
                                        <div
                                            key={note.id}
                                            className="bg-muted-bg/50 rounded-lg p-3 space-y-1"
                                        >
                                            {note.summary && (
                                                <p className="text-sm">
                                                    <strong>Summary:</strong>{" "}
                                                    {note.summary}
                                                </p>
                                            )}
                                            {note.doctors_notes && (
                                                <p className="text-sm">
                                                    <strong>
                                                        Doctor&apos;s Notes:
                                                    </strong>{" "}
                                                    {note.doctors_notes}
                                                </p>
                                            )}
                                            {note.prescription && (
                                                <p className="text-sm">
                                                    <strong>
                                                        Prescription:
                                                    </strong>{" "}
                                                    {note.prescription}
                                                </p>
                                            )}
                                            {note.exercises && (
                                                <p className="text-sm">
                                                    <strong>Exercises:</strong>{" "}
                                                    {note.exercises}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Notes Modal */}
            {showNotesForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-foreground">
                                Session Notes
                            </h2>
                            <button
                                onClick={() => setShowNotesForm(false)}
                                className="p-2 rounded-lg hover:bg-muted-bg transition-colors"
                            >
                                <X className="h-5 w-5 text-muted" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Summary
                                </label>
                                <textarea
                                    value={notesForm.summary}
                                    onChange={(e) =>
                                        setNotesForm({
                                            ...notesForm,
                                            summary: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Brief summary of the session..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Doctor&apos;s Notes
                                </label>
                                <textarea
                                    value={notesForm.doctors_notes}
                                    onChange={(e) =>
                                        setNotesForm({
                                            ...notesForm,
                                            doctors_notes: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Your professional observations..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Prescription
                                </label>
                                <textarea
                                    value={notesForm.prescription}
                                    onChange={(e) =>
                                        setNotesForm({
                                            ...notesForm,
                                            prescription: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Medication or recommendations..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Exercises
                                </label>
                                <textarea
                                    value={notesForm.exercises}
                                    onChange={(e) =>
                                        setNotesForm({
                                            ...notesForm,
                                            exercises: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Exercises or activities to assign..."
                                />
                            </div>
                            <button
                                onClick={submitNotes}
                                disabled={saving}
                                className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Save Notes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Therapist Journal Tab (Read-Only) ───────────────────────────────────────

function TherapistJournalTab({ userId }: { userId: string }) {
    const [entries, setEntries] = useState<JournalEntryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEntries() {
            const res = await fetch(
                `/api/therapists/journal?user_id=${userId}`
            );
            const data = await res.json();
            setEntries(Array.isArray(data) ? data : []);
            setLoading(false);
        }
        fetchEntries();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-primary flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    These are journal entries the patient has shared with you.
                    They are read-only.
                </p>
            </div>

            {entries.length === 0 ? (
                <div className="bg-white rounded-xl border border-border p-8 text-center text-muted">
                    This patient hasn&apos;t shared any journal entries with
                    you yet.
                </div>
            ) : (
                <div className="space-y-3">
                    {entries.map((entry) => (
                        <div
                            key={entry.id}
                            className="bg-white rounded-xl border border-border p-5 cursor-pointer hover:border-primary/30 transition-all"
                            onClick={() =>
                                setExpanded(
                                    expanded === entry.id ? null : entry.id
                                )
                            }
                        >
                            <div className="flex items-center justify-between mb-2">
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
                                <div className="flex items-center gap-2 flex-wrap">
                                    {entry.mental_health_score !== null && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            Mental Health: {entry.mental_health_score}
                                        </span>
                                    )}
                                    {entry.happiness_score !== null && (
                                        <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                                            Happiness: {entry.happiness_score}
                                        </span>
                                    )}
                                    {entry.accountability_score !== null && (
                                        <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">
                                            Accountability: {entry.accountability_score}
                                        </span>
                                    )}
                                    {entry.stress_score !== null && (
                                        <span className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full">
                                            Stress: {entry.stress_score}
                                        </span>
                                    )}
                                    {entry.burnout_risk_score !== null && (
                                        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                                            Burnout: {entry.burnout_risk_score}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-muted">
                                {expanded === entry.id
                                    ? entry.content
                                    : entry.content.slice(0, 150) +
                                      (entry.content.length > 150
                                          ? "..."
                                          : "")}
                            </p>
                            {expanded === entry.id && entry.ai_reflection && (
                                <div className="mt-3 pt-3 border-t border-border">
                                    <p className="text-xs font-medium text-muted mb-1">
                                        AI Reflection:
                                    </p>
                                    <p className="text-sm text-foreground italic">
                                        {entry.ai_reflection}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Therapist Prescriptions Tab ─────────────────────────────────────────────

function TherapistPrescriptionsTab({
    userId,
    relationshipId,
}: {
    userId: string;
    relationshipId: string;
}) {
    const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<
        "prescription" | "preventive_measure"
    >("prescription");
    const [formTitle, setFormTitle] = useState("");
    const [formContent, setFormContent] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchPrescriptions = useCallback(async () => {
        const res = await fetch(`/api/prescriptions?user_id=${userId}`);
        const data = await res.json();
        setPrescriptions(Array.isArray(data) ? data : []);
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        fetchPrescriptions();
    }, [fetchPrescriptions]);

    async function submitPrescription() {
        if (!formTitle.trim() || !formContent.trim()) return;
        setSaving(true);

        await fetch("/api/prescriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                relationship_id: relationshipId,
                type: formType,
                title: formTitle.trim(),
                content: formContent.trim(),
            }),
        });

        setShowForm(false);
        setFormTitle("");
        setFormContent("");
        setSaving(false);
        await fetchPrescriptions();
    }

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
            {/* Add New Button */}
            <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-dark transition-colors mb-6"
            >
                <Plus className="h-4 w-4" />
                Add Medication / Measure
            </button>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-foreground">
                                {formType === "prescription"
                                    ? "Prescribe Medication"
                                    : "Add Preventive Measure"}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 rounded-lg hover:bg-muted-bg transition-colors"
                            >
                                <X className="h-5 w-5 text-muted" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Type selector */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        setFormType("prescription")
                                    }
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        formType === "prescription"
                                            ? "bg-primary text-white"
                                            : "bg-muted-bg text-muted hover:text-foreground"
                                    }`}
                                >
                                    <Pill className="h-4 w-4 inline mr-1" />
                                    Medication
                                </button>
                                <button
                                    onClick={() =>
                                        setFormType("preventive_measure")
                                    }
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        formType === "preventive_measure"
                                            ? "bg-success text-white"
                                            : "bg-muted-bg text-muted hover:text-foreground"
                                    }`}
                                >
                                    <Heart className="h-4 w-4 inline mr-1" />
                                    Preventive Measure
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    {formType === "prescription"
                                        ? "Medicine Name"
                                        : "Title"}
                                </label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) =>
                                        setFormTitle(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder={
                                        formType === "prescription"
                                            ? "e.g. Sertraline 50mg"
                                            : "e.g. Daily Meditation Practice"
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    {formType === "prescription"
                                        ? "Dosage & Instructions"
                                        : "Details"}
                                </label>
                                <textarea
                                    value={formContent}
                                    onChange={(e) =>
                                        setFormContent(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder={
                                        formType === "prescription"
                                            ? "Dosage, frequency, duration, and any special instructions...\ne.g. Take 1 tablet daily in the morning with food. Continue for 4 weeks."
                                            : "Detailed instructions or recommendations for the patient..."
                                    }
                                />
                            </div>

                            <button
                                onClick={submitPrescription}
                                disabled={
                                    saving ||
                                    !formTitle.trim() ||
                                    !formContent.trim()
                                }
                                className={`w-full text-white py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                                    formType === "prescription"
                                        ? "bg-primary hover:bg-primary-dark"
                                        : "bg-success hover:bg-emerald-600"
                                }`}
                            >
                                {saving && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                {formType === "prescription"
                                    ? "Prescribe Medication"
                                    : "Add Measure"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
