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
    subtitle:
      "Mindfold uses AI to analyze your daily journal entries, track 5 key mental health metrics, and connect you with professional therapists — all in one place.",
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
          const hero = sections.find(
            (s: { section_name: string }) => s.section_name === "hero",
          );
          if (hero?.content) {
            setContent((prev) => ({ ...prev, ...hero.content }));
          }
        }
      })
      .catch((err) => console.error("Failed to load hero content:", err));
  }, []);

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-background -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        {content.badge && (
          <div className="inline-flex items-center gap-2 text-black border border-black px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            {content.badge}
          </div>
        )}

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-black max-w-4xl mx-auto leading-tight">
          {content.title}{" "}
          <span className="text-black">{content.titleHighlight}</span>
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
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-3.5 rounded-full text-base font-semibold hover:bg-gray-800 transition-colors shadow-lg"
          >
            {content.ctaPrimary || "Get Started"}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full text-base font-semibold border border-gray-300 hover:border-black transition-colors"
          >
            {content.ctaSecondary || "Watch Demo"}
          </a>
        </div>

        {/* Stats */}
        {content.stats && content.stats.length > 0 && (
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {content.stats.map((stat, idx) => (
              <div key={idx}>
                <p className="text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
