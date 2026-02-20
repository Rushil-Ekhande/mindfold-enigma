// ============================================================================
// Therapist Dashboard — Re-verification Page (Client Component)
// Allow rejected therapists to re-submit documents
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    Upload,
    FileText,
    Loader2,
    CheckCircle,
    XCircle,
} from "lucide-react";

interface TherapistStatus {
    verification_status: string;
    rejection_reason: string | null;
    rejection_count: number;
    can_resubmit: boolean;
    government_id_url: string | null;
    degree_certificate_url: string | null;
}

export default function TherapistReverificationPage() {
    const router = useRouter();
    const [status, setStatus] = useState<TherapistStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
    const [degreeCertFile, setDegreeCertFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStatus();
    }, []);

    async function fetchStatus() {
        try {
            const res = await fetch("/api/therapists/settings", { cache: "no-store" });
            if (!res.ok) {
                setError("Failed to fetch verification status");
                setLoading(false);
                return;
            }
            const data = await res.json();
            setStatus({
                verification_status: data.verification_status,
                rejection_reason: data.rejection_reason,
                rejection_count: data.rejection_count || 0,
                can_resubmit: data.can_resubmit ?? true,
                government_id_url: data.government_id_url,
                degree_certificate_url: data.degree_certificate_url,
            });
            setLoading(false);
        } catch (err) {
            console.error("Error fetching status:", err);
            setError("Failed to load verification status");
            setLoading(false);
        }
    }

    async function handleResubmit() {
        if (!governmentIdFile || !degreeCertFile) {
            setError("Please upload both documents");
            return;
        }

        setUploading(true);
        setError("");
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("government_id", governmentIdFile);
            formData.append("degree_certificate", degreeCertFile);

            const res = await fetch("/api/therapists/reverification", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to submit documents");
                setUploading(false);
                return;
            }

            setMessage("Documents submitted successfully! Awaiting admin review.");
            setTimeout(() => {
                router.push("/therapist/overview");
            }, 2000);
        } catch (err) {
            console.error("Error submitting documents:", err);
            setError("Failed to submit documents. Please try again.");
            setUploading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!status) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 text-center">
                    <XCircle className="h-12 w-12 text-danger mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-danger mb-2">
                        Unable to Load Status
                    </h2>
                    <p className="text-sm text-muted">
                        Please try again later or contact support.
                    </p>
                </div>
            </div>
        );
    }

    if (status.verification_status !== "rejected") {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-accent mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                        No Re-verification Needed
                    </h2>
                    <p className="text-sm text-muted">
                        Your application status is: {status.verification_status}
                    </p>
                </div>
            </div>
        );
    }

    if (!status.can_resubmit) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 text-center">
                    <XCircle className="h-12 w-12 text-danger mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-danger mb-2">
                        Re-submission Not Allowed
                    </h2>
                    <p className="text-sm text-muted mb-3">
                        You have reached the maximum number of rejections (3/3).
                    </p>
                    <p className="text-xs text-muted">
                        Please contact support for further assistance.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-2">
                Re-submit Verification Documents
            </h1>
            <p className="text-sm text-muted mb-6">
                Your previous application was rejected. Please review the reason and upload new documents.
            </p>

            {/* Rejection Info */}
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-danger mb-1">
                            Rejection Reason
                        </h3>
                        <p className="text-sm text-danger/90 mb-2">
                            {status.rejection_reason || "No reason provided"}
                        </p>
                        <p className="text-xs text-muted">
                            Attempts: {status.rejection_count}/3
                        </p>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {message && (
                <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-6 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <p className="text-sm text-success font-medium">{message}</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-6 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-danger" />
                    <p className="text-sm text-danger font-medium">{error}</p>
                </div>
            )}

            {/* Upload Form */}
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
                <h2 className="font-semibold text-foreground mb-4">
                    Upload New Documents
                </h2>
                <p className="text-xs text-muted mb-4">
                    Note: Uploading new documents will replace your previous submissions.
                </p>

                {/* Government ID */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Government ID
                    </label>
                    <label className="flex items-center gap-3 w-full px-4 py-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/30 transition-colors">
                        <Upload className="h-5 w-5 text-muted" />
                        <span className="text-sm text-muted">
                            {governmentIdFile
                                ? governmentIdFile.name
                                : "Upload Government ID (PDF, JPG, PNG)"}
                        </span>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                                setGovernmentIdFile(e.target.files?.[0] || null)
                            }
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Degree Certificate */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Degree Certificate
                    </label>
                    <label className="flex items-center gap-3 w-full px-4 py-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/30 transition-colors">
                        <FileText className="h-5 w-5 text-muted" />
                        <span className="text-sm text-muted">
                            {degreeCertFile
                                ? degreeCertFile.name
                                : "Upload Degree Certificate (PDF, JPG, PNG)"}
                        </span>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                                setDegreeCertFile(e.target.files?.[0] || null)
                            }
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            {/* Submit Button */}
            <button
                onClick={handleResubmit}
                disabled={uploading || !governmentIdFile || !degreeCertFile}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {uploading ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Upload className="h-5 w-5" />
                        Submit for Re-verification
                    </>
                )}
            </button>

            <p className="text-xs text-muted text-center mt-4">
                After submission, your application will be reviewed by our admin team.
            </p>
        </div>
    );
}
