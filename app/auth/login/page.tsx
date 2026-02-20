// ============================================================================
// Login Page
// ============================================================================

"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brain, Loader2 } from "lucide-react";
import { loginAction } from "@/app/auth/actions";

function LoginForm() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const registered = searchParams.get("registered");
    const therapistRegistered = searchParams.get("therapist_registered");

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");
        const result = await loginAction(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <Brain className="h-9 w-9 text-primary" />
                    <span className="text-2xl font-bold text-foreground">Mindfold</span>
                </Link>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-border p-8">
                    <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-muted text-center mb-6">
                        Sign in to your account
                    </p>

                    {/* Success Messages */}
                    {registered && (
                        <div className="bg-success/10 text-success text-sm px-4 py-3 rounded-lg mb-4">
                            Account created successfully! Please log in.
                        </div>
                    )}
                    {therapistRegistered && (
                        <div className="bg-success/10 text-success text-sm px-4 py-3 rounded-lg mb-4">
                            Registration submitted! You&apos;ll be notified once verified. You can log in now.
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form action={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="you@example.com"
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
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Sign In
                        </button>
                    </form>

                    {/* Links */}
                    <div className="mt-6 text-center text-sm text-muted">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/auth/signup"
                            className="text-primary font-medium hover:underline"
                        >
                            Sign Up
                        </Link>
                    </div>
                    <div className="mt-2 text-center text-sm text-muted">
                        Are you a therapist?{" "}
                        <Link
                            href="/auth/therapist-register"
                            className="text-primary font-medium hover:underline"
                        >
                            Register Here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
