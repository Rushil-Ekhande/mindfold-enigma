// ============================================================================
// Landing Page — Features Section (Dynamic)
// ============================================================================

"use client";

import {
    BookOpen,
    Brain,
    BarChart3,
    MessageCircle,
    Shield,
    Users,
    LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Feature {
    icon: string;
    title: string;
    description: string;
}

interface FeaturesContent {
    heading?: string;
    headingHighlight?: string;
    subtitle?: string;
    features?: Feature[];
}

const iconMap: Record<string, LucideIcon> = {
    BookOpen,
    Brain,
    BarChart3,
    MessageCircle,
    Shield,
    Users,
};

const defaultFeatures: Feature[] = [
    {
        icon: "BookOpen",
        title: "Smart Journaling",
        description:
            "Write daily entries and receive instant AI-generated reflections that help you understand your emotional patterns.",
    },
    {
        icon: "Brain",
        title: "Mental Health Metrics",
        description:
            "Track 5 key metrics — mental health, happiness, accountability, stress, and burnout risk — scored from every entry.",
    },
    {
        icon: "BarChart3",
        title: "Visual Analytics",
        description:
            "Beautiful graphs and charts that show your wellness trends over time, helping you spot patterns and celebrate progress.",
    },
    {
        icon: "MessageCircle",
        title: "Ask Your Journal",
        description:
            "Chat with an AI that has read your journal. Ask questions like 'Why do I feel stressed on Mondays?' and get real answers.",
    },
    {
        icon: "Users",
        title: "Therapist Connect",
        description:
            "Browse verified therapists, book sessions, and share selected journal entries for more personalized professional support.",
    },
    {
        icon: "Shield",
        title: "Privacy First",
        description:
            "Full control over what your therapist can see. Toggle visibility per entry, or disable sharing entirely.",
    },
];

export default function FeaturesSection() {
    const [content, setContent] = useState<FeaturesContent>({
        heading: "Everything You Need for",
        headingHighlight: "Mental Wellness",
        subtitle: "Powerful tools designed to help you understand yourself better and take control of your mental health journey.",
        features: defaultFeatures,
    });

    useEffect(() => {
        fetch("/api/landing")
            .then((res) => res.json())
            .then((sections) => {
                if (Array.isArray(sections)) {
                    const features = sections.find((s: { section_name: string }) => s.section_name === "features");
                    if (features?.content) {
                        setContent((prev) => ({ ...prev, ...features.content }));
                    }
                }
            })
            .catch((err) => console.error("Failed to load features content:", err));
    }, []);

    return (
        <section id="features" className="py-20 bg-muted-bg/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                        {content.heading}{" "}
                        <span className="text-primary">{content.headingHighlight}</span>
                    </h2>
                    {content.subtitle && (
                        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
                            {content.subtitle}
                        </p>
                    )}
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {content.features?.map((feature, idx) => {
                        const IconComponent = iconMap[feature.icon] || BookOpen;
                        return (
                            <div
                                key={idx}
                                className="bg-white p-8 rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                                    <IconComponent className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-muted leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
