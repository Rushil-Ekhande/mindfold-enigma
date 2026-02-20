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
        badge: "AI-POWERED SELF REFLECTION",
        title: "LIFE IMITATES LIFE",
        titleHighlight: "",
        subtitle: "Your private AI journal for self-reflection. Discover patterns, gain insights,\nand understand your emotions over time.",
        ctaPrimary: "Get Started Free",
        ctaSecondary: "Watch Demo",
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
        <section className="relative pt-40 pb-32 overflow-hidden bg-[#f7f6f4]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
                {/* Badge */}
                {content.badge && (
                    <div className="inline-flex items-center gap-2 bg-transparent border border-black/80 text-black px-4 py-1.5 rounded-full text-[10px] tracking-widest font-semibold uppercase mb-10">
                        <div className="w-1.5 h-1.5 bg-black rounded-full" />
                        {content.badge}
                    </div>
                )}

                {/* Heading */}
                <h1 className="text-7xl sm:text-8xl md:text-[8rem] font-black tracking-tight text-[#0a1128] max-w-6xl mx-auto leading-none uppercase">
                    {content.title}
                </h1>

                {/* Subtitle */}
                {content.subtitle && (
                    <p className="mt-8 text-lg sm:text-xl text-[#5b637a] font-medium max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
                        {content.subtitle}
                    </p>
                )}

                {/* CTAs */}
                <div className="mt-12 flex items-center justify-center gap-4">
                    <Link
                        href="/auth/signup"
                        className="inline-flex items-center gap-2 bg-[#0a1128] text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-black transition-colors"
                    >
                        {content.ctaPrimary || "Get Started Free"}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                        href="#how-it-works"
                        className="inline-flex items-center gap-2 bg-white text-[#0a1128] border border-black/10 px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-gray-50 hover:border-black/20 transition-all shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {content.ctaSecondary || "Watch Demo"}
                    </a>
                </div>
            </div>
        </section>
    );
}
