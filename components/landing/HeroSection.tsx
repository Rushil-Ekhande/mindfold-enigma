// ============================================================================
// Landing Page — Hero Section (Dynamic)
// ============================================================================

"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface HeroContent {
    badge?: string;
    title?: string;
    titleHighlight?: string;
    subtitle?: string;
    ctaPrimary?: string;
    ctaSecondary?: string;
    stats?: Array<{ value: string; label: string }>;
}

export default function HeroSection() {
    const [content, setContent] = useState<HeroContent>({
        badge: "AI-Powered Mental Wellness",
        title: "Transform Your Thoughts Into",
        titleHighlight: "Wellness Insights",
        subtitle: "Mindfold uses AI to analyze your daily journal entries, track 5 key mental health metrics, and connect you with professional therapists — all in one place.",
        ctaPrimary: "Start Journaling Free",
        ctaSecondary: "See How It Works",
        stats: [
            { value: "5", label: "Wellness Metrics" },
            { value: "AI", label: "Powered Insights" },
            { value: "24/7", label: "Reflection Access" },
        ],
    });

    useEffect(() => {
        fetch("/api/landing")
            .then((res) => res.json())
            .then((sections) => {
                if (Array.isArray(sections)) {
                    const hero = sections.find((s: { section_name: string }) => s.section_name === "hero");
                    if (hero?.content) {
                        setContent((prev) => ({ ...prev, ...hero.content }));
                    }
                }
            })
            .catch((err) => console.error("Failed to load hero content:", err));
    }, []);

    return (
        <section className="relative pt-32 pb-20 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 -z-10" />
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Badge */}
                {content.badge && (
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                        <Sparkles className="h-4 w-4" />
                        {content.badge}
                    </div>
                )}

                {/* Heading */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
                    {content.title}{" "}
                    <span className="text-primary">{content.titleHighlight}</span>
                </h1>

                {/* Subtitle */}
                {content.subtitle && (
                    <p className="mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
                        {content.subtitle}
                    </p>
                )}

                {/* CTAs */}
                <div className="mt-10 flex items-center justify-center gap-4">
                    <Link
                        href="/auth/signup"
                        className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
                    >
                        {content.ctaPrimary || "Start Journaling Free"}
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                    <a
                        href="#how-it-works"
                        className="inline-flex items-center gap-2 bg-white text-foreground px-8 py-3.5 rounded-xl text-base font-semibold border border-border hover:border-primary/30 transition-colors"
                    >
                        {content.ctaSecondary || "See How It Works"}
                    </a>
                </div>

                {/* Stats */}
                {content.stats && content.stats.length > 0 && (
                    <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                        {content.stats.map((stat, idx) => (
                            <div key={idx}>
                                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-sm text-muted mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
