// ============================================================================
// Therapist Dashboard — Patients Page (Client Component)
// View patients, manage sessions, write notes
// ============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

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
    session_notes: {
        id: string;
        summary: string | null;
        doctors_notes: string | null;
        prescription: string | null;
        exercises: string | null;
    }[];
}

export default function PatientsPage() {
    const [patients, setPatients] = useState<PatientData[]>([]);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
    const [loading, setLoading] = useState(true);

    // Session management state
    const [meetingLink, setMeetingLink] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");

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

    // Fetch sessions (which contain patient info)
    const fetchSessions = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/sessions");
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Fetch patients list from therapist_patients
    useEffect(() => {
        async function fetchPatients() {
            const res = await fetch("/api/therapists/patients");
            const data = await res.json();
            setPatients(Array.isArray(data) ? data : []);
        }
        fetchPatients();
    }, []);

    // Accept a session
    async function acceptSession(sessionId: string) {
        await fetch("/api/sessions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: sessionId,
                status: "scheduled",
                meeting_link: meetingLink,
                scheduled_date: scheduledDate || new Date().toISOString(),
            }),
        });
        setMeetingLink("");
        setScheduledDate("");
        await fetchSessions();
    }

    // Postpone a session
    async function postponeSession(sessionId: string) {
        await fetch("/api/sessions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: sessionId,
                status: "postponed",
            }),
        });
        await fetchSessions();
    }

    // Complete a session
    async function completeSession(sessionId: string) {
        await fetch("/api/sessions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: sessionId,
                status: "completed",
            }),
        });
        await fetchSessions();
    }

    // Submit session notes
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
        await fetchSessions();
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    // Individual patient view
    if (selectedPatient) {
        const patientSessions = sessions.filter(
            (s) => s.user_id === selectedPatient.user_id
        );

        return (
            <div className="max-w-4xl">
                <button
                    onClick={() => setSelectedPatient(null)}
                    className="flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Patients
                </button>

                <h1 className="text-2xl font-bold text-foreground mb-6">
                    Patient: {selectedPatient.profiles?.full_name || "Unknown"}
                </h1>

                {/* Sessions */}
                <div className="space-y-4">
                    {patientSessions.length === 0 ? (
                        <div className="bg-white rounded-xl border border-border p-8 text-center text-muted">
                            No sessions with this patient yet.
                        </div>
                    ) : (
                        patientSessions.map((session) => (
                            <div
                                key={session.id}
                                className="bg-white rounded-xl border border-border p-5"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span
                                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${session.status === "completed"
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
                                        {new Date(session.requested_date).toLocaleDateString()}
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
                                            onChange={(e) => setMeetingLink(e.target.value)}
                                            placeholder="Meeting link (Google Meet, Zoom, etc.)"
                                            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <input
                                            type="datetime-local"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => acceptSession(session.id)}
                                                className="flex items-center gap-1.5 bg-success text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                                            >
                                                <Check className="h-4 w-4" />
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => postponeSession(session.id)}
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
                                        {session.meeting_link && (
                                            <a
                                                href={session.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                Join Meeting
                                            </a>
                                        )}
                                        <button
                                            onClick={() => completeSession(session.id)}
                                            className="flex items-center gap-1.5 bg-success text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                                        >
                                            <Check className="h-4 w-4" />
                                            Mark Complete
                                        </button>
                                    </div>
                                )}

                                {/* Write Notes Button */}
                                {(session.status === "completed" || session.status === "scheduled") && (
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
                                        <p className="text-xs font-medium text-muted">Session Notes:</p>
                                        {session.session_notes.map((note) => (
                                            <div key={note.id} className="bg-muted-bg/50 rounded-lg p-3 space-y-1">
                                                {note.summary && (
                                                    <p className="text-sm"><strong>Summary:</strong> {note.summary}</p>
                                                )}
                                                {note.doctors_notes && (
                                                    <p className="text-sm"><strong>Doctor&apos;s Notes:</strong> {note.doctors_notes}</p>
                                                )}
                                                {note.prescription && (
                                                    <p className="text-sm"><strong>Prescription:</strong> {note.prescription}</p>
                                                )}
                                                {note.exercises && (
                                                    <p className="text-sm"><strong>Exercises:</strong> {note.exercises}</p>
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
                                            setNotesForm({ ...notesForm, summary: e.target.value })
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
                                            setNotesForm({ ...notesForm, exercises: e.target.value })
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
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Save Notes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Patient list view
    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-foreground mb-6">Patients</h1>

            {patients.length === 0 ? (
                <div className="bg-white rounded-xl border border-border p-12 text-center">
                    <Users className="h-12 w-12 text-muted/30 mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-1">No Patients Yet</h3>
                    <p className="text-sm text-muted">
                        Patients will appear here once they subscribe to your services.
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
                                        {(patient.profiles?.full_name || "?").charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">
                                            {patient.profiles?.full_name || "Unknown Patient"}
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
