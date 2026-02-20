// ============================================================================
// User Dashboard — My Therapist Page (Client Component)
// Search therapists, manage relationship, request sessions
// ============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

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
}

interface SessionData {
    id: string;
    status: string;
    scheduled_date: string | null;
    meeting_link: string | null;
    requested_date: string;
    session_notes: {
        summary: string | null;
        prescription: string | null;
        exercises: string | null;
    }[];
}

export default function TherapistPage() {
    const [hasTherapist, setHasTherapist] = useState(false);
    const [therapists, setTherapists] = useState<TherapistData[]>([]);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [relationship, setRelationship] = useState<{ id: string; therapist_id: string } | null>(null);
    const [allowAccess, setAllowAccess] = useState(true);

    // Check if user has a therapist
    const checkRelationship = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/sessions");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            setHasTherapist(true);
            setSessions(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        checkRelationship();
    }, [checkRelationship]);

    // Search therapists
    async function searchTherapists() {
        const res = await fetch(`/api/therapists?search=${encodeURIComponent(search)}`);
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
            body: JSON.stringify({ therapist_id: therapistId, service_id: serviceId }),
        });
        const data = await res.json();
        if (data.id) {
            setRelationship({ id: data.id, therapist_id: therapistId });
            setHasTherapist(true);
            await checkRelationship();
        }
    }

    // Request a session
    async function requestSession() {
        if (!relationship) return;
        await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                relationship_id: relationship.id,
                therapist_id: relationship.therapist_id,
            }),
        });
        await checkRelationship();
    }

    // Toggle therapist access to journal entries
    async function toggleAccess() {
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
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    // If user already has a therapist, show management view
    if (hasTherapist) {
        return (
            <div className="w-full">
                <h1 className="text-2xl font-bold text-foreground mb-6">
                    My Therapist
                </h1>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <button
                        onClick={requestSession}
                        className="bg-white rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all text-left"
                    >
                        <Calendar className="h-5 w-5 text-primary mb-2" />
                        <h3 className="font-semibold text-foreground">Request Session</h3>
                        <p className="text-xs text-muted mt-1">
                            Send a session request to your therapist
                        </p>
                    </button>

                    <button
                        onClick={toggleAccess}
                        className="bg-white rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all text-left"
                    >
                        {allowAccess ? (
                            <Shield className="h-5 w-5 text-success mb-2" />
                        ) : (
                            <ShieldOff className="h-5 w-5 text-danger mb-2" />
                        )}
                        <h3 className="font-semibold text-foreground">
                            Journal Access: {allowAccess ? "ON" : "OFF"}
                        </h3>
                        <p className="text-xs text-muted mt-1">
                            {allowAccess
                                ? "Therapist can view your entries"
                                : "Therapist cannot view your entries"}
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
                <h2 className="text-lg font-semibold text-foreground mb-4">Sessions</h2>
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
                                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${session.status === "completed"
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
                                        {new Date(session.requested_date).toLocaleDateString()}
                                    </span>
                                </div>

                                {session.meeting_link && (
                                    <a
                                        href={session.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-3"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Join Meeting
                                    </a>
                                )}

                                {/* Session Notes */}
                                {session.session_notes?.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                                        {session.session_notes.map((note, i) => (
                                            <div key={i} className="space-y-2">
                                                {note.summary && (
                                                    <div>
                                                        <p className="text-xs font-medium text-muted flex items-center gap-1">
                                                            <FileText className="h-3 w-3" /> Summary
                                                        </p>
                                                        <p className="text-sm text-foreground">
                                                            {note.summary}
                                                        </p>
                                                    </div>
                                                )}
                                                {note.prescription && (
                                                    <div>
                                                        <p className="text-xs font-medium text-muted">
                                                            Prescription
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

    // Search view — user doesn't have a therapist yet
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
                        onKeyDown={(e) => e.key === "Enter" && searchTherapists()}
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
                            className="bg-white rounded-xl border border-border p-6"
                        >
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                                    {(therapist.display_name || therapist.profiles.full_name)
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-foreground">
                                            {therapist.display_name || therapist.profiles.full_name}
                                        </h3>
                                        <div className="flex items-center gap-0.5">
                                            <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                                            <span className="text-xs text-muted">
                                                {therapist.rating.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted mt-1">
                                        {therapist.description || "Licensed mental health professional"}
                                    </p>

                                    {/* Services */}
                                    {therapist.therapist_services?.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <p className="text-xs font-medium text-muted">
                                                Available Plans:
                                            </p>
                                            {therapist.therapist_services.map((service) => (
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
                                                                subscribeToService(therapist.id, service.id)
                                                            }
                                                            className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                                                        >
                                                            Choose
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
