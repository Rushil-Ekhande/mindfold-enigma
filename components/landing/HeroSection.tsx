// ============================================================================
// Landing Page — Hero Section
// ============================================================================

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 -z-10" />
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                    <Sparkles className="h-4 w-4" />
                    AI-Powered Mental Wellness
                </div>

                {/* Heading */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
                    Transform Your Thoughts Into{" "}
                    <span className="text-primary">Wellness Insights</span>
                </h1>

                {/* Subtitle */}
                <p className="mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
                    Mindfold uses AI to analyze your daily journal entries, track 5 key
                    mental health metrics, and connect you with professional therapists —
                    all in one place.
                </p>

                {/* CTAs */}
                <div className="mt-10 flex items-center justify-center gap-4">
                    <Link
                        href="/auth/signup"
                        className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
                    >
                        Start Journaling Free
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                    <a
                        href="#how-it-works"
                        className="inline-flex items-center gap-2 bg-white text-foreground px-8 py-3.5 rounded-xl text-base font-semibold border border-border hover:border-primary/30 transition-colors"
                    >
                        See How It Works
                    </a>
                </div>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                    <div>
                        <p className="text-3xl font-bold text-foreground">5</p>
                        <p className="text-sm text-muted mt-1">Wellness Metrics</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-foreground">AI</p>
                        <p className="text-sm text-muted mt-1">Powered Insights</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-foreground">24/7</p>
                        <p className="text-sm text-muted mt-1">Reflection Access</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
