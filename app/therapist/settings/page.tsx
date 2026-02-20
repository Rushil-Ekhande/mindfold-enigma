// ============================================================================
// Therapist Dashboard — Settings Page (Client Component)
// Manage display name, description, pricing, photo, qualifications
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import {
    User,
    FileText,
    DollarSign,
    Camera,
    Award,
    Loader2,
    CheckCircle,
    Plus,
    Trash2,
} from "lucide-react";

interface ServiceData {
    id?: string;
    sessions_per_week: number;
    price_per_session: number;
    description: string;
    is_active: boolean;
}

interface TherapistProfile {
    display_name: string | null;
    description: string | null;
    qualifications: string[] | null;
    services: ServiceData[];
    verification_status: string;
    rejection_reason: string | null;
    rejection_count: number;
    can_resubmit: boolean;
}

export default function TherapistSettingsPage() {
    const [displayName, setDisplayName] = useState("");
    const [description, setDescription] = useState("");
    const [qualifications, setQualifications] = useState<string[]>([]);
    const [newQualification, setNewQualification] = useState("");
    const [services, setServices] = useState<ServiceData[]>([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [verificationStatus, setVerificationStatus] = useState<string>("");
    const [rejectionInfo, setRejectionInfo] = useState<{
        reason: string | null;
        count: number;
        canResubmit: boolean;
    } | null>(null);

    // Fetch current settings
    useEffect(() => {
        async function fetchSettings() {
            const res = await fetch("/api/therapists/settings");
            const data = await res.json();
            if (data) {
                setDisplayName(data.display_name || "");
                setDescription(data.description || "");
                setQualifications(data.qualifications || []);
                setServices(data.services || []);
                setVerificationStatus(data.verification_status || "pending");
                if (data.verification_status === "rejected") {
                    setRejectionInfo({
                        reason: data.rejection_reason,
                        count: data.rejection_count || 0,
                        canResubmit: data.can_resubmit ?? true,
                    });
                }
            }
        }
        fetchSettings();
    }, []);

    // Save profile settings
    async function saveProfile() {
        setSaving(true);
        setMessage("");
        const res = await fetch("/api/therapists/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                display_name: displayName,
                description,
                qualifications,
                services,
            }),
        });
        if (res.ok) setMessage("Settings saved successfully!");
        setSaving(false);
    }

    // Add qualification
    function addQualification() {
        if (newQualification.trim()) {
            setQualifications([...qualifications, newQualification.trim()]);
            setNewQualification("");
        }
    }

    // Add service
    function addService() {
        setServices([
            ...services,
            { sessions_per_week: 1, price_per_session: 50, description: "", is_active: true },
        ]);
    }

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

            {/* Verification Status Banner */}
            {verificationStatus === "rejected" && rejectionInfo && (
                <div className="bg-danger/10 border border-danger/30 rounded-xl p-5 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-danger/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-danger text-lg">⚠️</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-danger mb-1">
                                Verification Rejected
                            </h3>
                            <p className="text-sm text-danger/90 mb-2">
                                {rejectionInfo.reason || "Your application has been rejected."}
                            </p>
                            {rejectionInfo.canResubmit ? (
                                <a
                                    href="/therapist/reverification"
                                    className="inline-flex items-center gap-2 bg-danger text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                                >
                                    Re-submit Documents
                                </a>
                            ) : (
                                <p className="text-xs text-danger font-medium">
                                    Maximum rejection limit reached ({rejectionInfo.count}/3)
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {verificationStatus === "pending" && (
                <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6">
                    <p className="text-sm text-accent font-medium">
                        ⏳ Your profile is pending verification.
                    </p>
                </div>
            )}

            {verificationStatus === "approved" && (
                <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-6">
                    <p className="text-sm text-success font-medium">
                        ✅ Your profile is verified and active!
                    </p>
                </div>
            )}

            {/* Status Message */}
            {message && (
                <div className="flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-3 rounded-lg mb-6">
                    <CheckCircle className="h-4 w-4" />
                    {message}
                </div>
            )}

            {/* Display Name & Description */}
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-foreground">Profile Info</h2>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="Dr. Jane Smith"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2.5 border border-border rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="Your professional bio and specialization..."
                        />
                    </div>
                </div>
            </div>

            {/* Photo Upload */}
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Camera className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-foreground">Profile Photo</h2>
                </div>
                <label className="flex items-center gap-3 w-full px-4 py-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/30 transition-colors">
                    <Camera className="h-5 w-5 text-muted" />
                    <span className="text-sm text-muted">
                        Upload a professional photo (JPG, PNG)
                    </span>
                    <input type="file" accept=".jpg,.jpeg,.png" className="hidden" />
                </label>
            </div>

            {/* Qualifications */}
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-foreground">Qualifications</h2>
                </div>
                <div className="space-y-2 mb-3">
                    {qualifications.map((q, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between bg-muted-bg/50 px-3 py-2 rounded-lg"
                        >
                            <span className="text-sm text-foreground">{q}</span>
                            <button
                                onClick={() =>
                                    setQualifications(qualifications.filter((_, idx) => idx !== i))
                                }
                                className="text-muted hover:text-danger transition-colors"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newQualification}
                        onChange={(e) => setNewQualification(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addQualification()}
                        placeholder="Add a qualification..."
                        className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                        onClick={addQualification}
                        className="bg-primary text-white px-3 py-2 rounded-lg text-sm"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Services / Pricing */}
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold text-foreground">Services & Pricing</h2>
                    </div>
                    <button
                        onClick={addService}
                        className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Service
                    </button>
                </div>
                <div className="space-y-4">
                    {services.map((service, i) => (
                        <div key={i} className="bg-muted-bg/50 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted mb-1">
                                        Sessions/Week
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={service.sessions_per_week}
                                        onChange={(e) => {
                                            const updated = [...services];
                                            updated[i].sessions_per_week = parseInt(e.target.value) || 1;
                                            setServices(updated);
                                        }}
                                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted mb-1">
                                        Price/Session ($)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={service.price_per_session}
                                        onChange={(e) => {
                                            const updated = [...services];
                                            updated[i].price_per_session =
                                                parseFloat(e.target.value) || 0;
                                            setServices(updated);
                                        }}
                                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <input
                                type="text"
                                value={service.description}
                                onChange={(e) => {
                                    const updated = [...services];
                                    updated[i].description = e.target.value;
                                    setServices(updated);
                                }}
                                placeholder="Service description..."
                                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <button
                                onClick={() => setServices(services.filter((_, idx) => idx !== i))}
                                className="text-xs text-danger hover:underline flex items-center gap-1"
                            >
                                <Trash2 className="h-3 w-3" />
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save */}
            <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save All Settings
            </button>
        </div>
    );
}
