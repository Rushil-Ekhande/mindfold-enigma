// ============================================================================
// Therapist Registration Page
// ============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Loader2, Upload } from "lucide-react";
import { therapistRegisterAction } from "@/app/auth/actions";

export default function TherapistRegisterPage() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");
        const result = await therapistRegisterAction(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-12">
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
                    <form action={handleSubmit} className="space-y-4">
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
                                    Upload government ID (PDF, JPG, PNG)
                                </span>
                                <input
                                    type="file"
                                    name="governmentId"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    required
                                    className="hidden"
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
                                    Upload degree certificate (PDF, JPG, PNG)
                                </span>
                                <input
                                    type="file"
                                    name="degreeCertificate"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    required
                                    className="hidden"
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
