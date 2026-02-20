"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Brain, Loader2, Upload } from "lucide-react";
// import { therapistRegisterAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";

export default function TherapistRegisterPage() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [governmentIdName, setGovernmentIdName] = useState<string>("");
    const [degreeCertificateName, setDegreeCertificateName] = useState<string>("");
    const governmentIdInputRef = useRef<HTMLInputElement>(null);
    const degreeCertificateInputRef = useRef<HTMLInputElement>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const form = e.currentTarget;
        const formData = new FormData(form);
        const fullName = formData.get("fullName") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const licenseNumber = formData.get("licenseNumber") as string;
        const governmentIdInput = governmentIdInputRef.current;
        const degreeCertificateInput = degreeCertificateInputRef.current;
        let governmentIdUrl = "";
        let degreeCertificateUrl = "";
        const supabase = createClient();

        // 1. Sign up user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });
        if (authError || !authData.user) {
            setError(authError?.message || "Registration failed.");
            setLoading(false);
            return;
        }
        const userId = authData.user.id;

        // 2. Upload government ID
        if (governmentIdInput?.files?.[0]) {
            const file = governmentIdInput.files[0];
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const { data, error: uploadError } = await supabase.storage
                .from("therapist-documents")
                .upload(`temp/government_id_${sanitizedName}`, file);
            if (uploadError) {
                setError(uploadError.message || "Upload failed for government ID.");
                setLoading(false);
                return;
            }
            if (data) {
                governmentIdUrl = data.path; // Store path, not signed URL
            }
        } else {
            setError("Please select a government ID file.");
            setLoading(false);
            return;
        }

        // 3. Upload degree certificate
        if (degreeCertificateInput?.files?.[0]) {
            const file = degreeCertificateInput.files[0];
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const { data, error: uploadError } = await supabase.storage
                .from("therapist-documents")
                .upload(`temp/degree_certificate_${sanitizedName}`, file);
            if (uploadError) {
                setError(uploadError.message || "Upload failed for degree certificate.");
                setLoading(false);
                return;
            }
            if (data) {
                degreeCertificateUrl = data.path; // Store path, not signed URL
            }
        } else {
            setError("Please select a degree certificate file.");
            setLoading(false);
            return;
        }

        // 4. Insert profile row
        const { error: profileError } = await supabase.from("profiles").insert({
            id: userId,
            full_name: fullName,
            email,
            role: "therapist",
        });
        if (profileError) {
            setError("Failed to create profile.");
            setLoading(false);
            return;
        }

        // 5. Insert therapist_profile row
        const { error: therapistError } = await supabase.from("therapist_profiles").insert({
            id: userId,
            display_name: fullName,
            license_number: licenseNumber,
            government_id_url: governmentIdUrl, // Store path, not URL
            degree_certificate_url: degreeCertificateUrl, // Store path, not URL
            verification_status: "pending",
        });
        if (therapistError) {
            setError("Failed to create therapist profile.");
            setLoading(false);
            return;
        }

        setLoading(false);
        window.location.href = "/auth/login?therapist_registered=true";
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-cyan-50 px-4 py-12">
            <div className="w-full max-w-lg">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <Brain className="h-9 w-9 text-primary" />
                    <span className="text-2xl font-bold text-foreground">Mindfold</span>
                </Link>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-border p-8">
                    <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                        Therapist Registration
                    </h1>
                    <p className="text-muted text-center mb-6">
                        Join our network of verified mental health professionals
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                required
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="Dr. Jane Smith"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="therapist@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                minLength={6}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Professional License Number
                            </label>
                            <input
                                type="text"
                                name="licenseNumber"
                                required
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="LIC-XXXXXX"
                            />
                        </div>

                        {/* File Uploads */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Government-Issued ID
                            </label>
                            <label className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/30 transition-colors">
                                <Upload className="h-5 w-5 text-muted" />
                                <span className="text-sm text-muted">
                                    {governmentIdName ? (
                                        <span className="text-foreground">{governmentIdName}</span>
                                    ) : (
                                        "Upload government ID (PDF, JPG, PNG)"
                                    )}
                                </span>
                                <input
                                    type="file"
                                    name="governmentId"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    required
                                    className="sr-only"
                                    ref={governmentIdInputRef}
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setGovernmentIdName(e.target.files[0].name);
                                        } else {
                                            setGovernmentIdName("");
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Degree Certificate
                            </label>
                            <label className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/30 transition-colors">
                                <Upload className="h-5 w-5 text-muted" />
                                <span className="text-sm text-muted">
                                    {degreeCertificateName ? (
                                        <span className="text-foreground">{degreeCertificateName}</span>
                                    ) : (
                                        "Upload degree certificate (PDF, JPG, PNG)"
                                    )}
                                </span>
                                <input
                                    type="file"
                                    name="degreeCertificate"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    required
                                    className="sr-only"
                                    ref={degreeCertificateInputRef}
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setDegreeCertificateName(e.target.files[0].name);
                                        } else {
                                            setDegreeCertificateName("");
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Submit Registration
                        </button>
                    </form>

                    <p className="mt-4 text-xs text-muted text-center">
                        Your documents will be reviewed by our admin team. You&apos;ll be
                        notified once your profile is verified.
                    </p>

                    {/* Links */}
                    <div className="mt-6 text-center text-sm text-muted">
                        Already registered?{" "}
                        <Link
                            href="/auth/login"
                            className="text-primary font-medium hover:underline"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
