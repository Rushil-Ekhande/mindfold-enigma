// ============================================================================
// Landing Page — How It Works Section (Dynamic)
// ============================================================================

"use client";

import { UserPlus, PenLine, Sparkles, TrendingUp, LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface Step {
    icon: string;
    step: number;
    title: string;
    description: string;
}

interface HowItWorksContent {
    heading?: string;
    headingHighlight?: string;
    subtitle?: string;
    steps?: Step[];
}

const iconMap: Record<string, LucideIcon> = {
    UserPlus,
    PenLine,
    Sparkles,
    TrendingUp,
};

const defaultSteps: Step[] = [
    {
        icon: "UserPlus",
        step: 1,
        title: "Create Your Account",
        description:
            "Sign up in seconds with just your name, email, and password. No credit card required to get started.",
    },
    {
        icon: "PenLine",
        step: 2,
        title: "Write Daily Entries",
        description:
            "Journal about your day in up to 2000 characters. Our clean editor makes it easy to express your thoughts.",
    },
    {
        icon: "Sparkles",
        step: 3,
        title: "Get AI Insights",
        description:
            "Our AI instantly analyzes your entry, generates a reflection, and scores 5 mental health metrics.",
    },
    {
        icon: "TrendingUp",
        step: 4,
        title: "Track Your Progress",
        description:
            "Watch your metrics improve over time. Ask your journal questions and connect with therapists for deeper support.",
    },
];

export default function HowItWorksSection() {
    const [content, setContent] = useState<HowItWorksContent>({
        heading: "How",
        headingHighlight: "Mindfold",
        subtitle: "Four simple steps to start your mental wellness journey.",
        steps: defaultSteps,
    });

    useEffect(() => {
        fetch("/api/landing")
            .then((res) => res.json())
            .then((sections) => {
                if (Array.isArray(sections)) {
                    const howItWorks = sections.find((s: { section_name: string }) => s.section_name === "how_to_use");
                    if (howItWorks?.content) {
                        setContent((prev) => ({ ...prev, ...howItWorks.content }));
                    }
                }
            })
            .catch((err) => console.error("Failed to load how it works content:", err));
    }, []);

    return (
        <section id="how-it-works" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                        {content.heading} <span className="text-primary">{content.headingHighlight}</span> Works
                    </h2>
                    {content.subtitle && (
                        <p className="mt-6 text-lg text-muted font-medium max-w-2xl mx-auto">
                            {content.subtitle}
                        </p>
                    )}
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {content.steps?.map((step) => {
                        const IconComponent = iconMap[step.icon] || Sparkles;
                        return (
                            <div key={step.step} className="text-center group">
                                {/* Step Number & Icon */}
                                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-primary-light text-primary rounded-[2rem] mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                                    <IconComponent className="h-8 w-8" strokeWidth={2.5} />
                                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white text-sm font-bold rounded-full flex items-center justify-center shadow-sm">
                                        {step.step}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-muted font-medium leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
