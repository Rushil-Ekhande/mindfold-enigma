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

    // Feature icon colors for a playful, pastel aesthetic
    const featureColors = [
        { bg: "bg-blue-100", text: "text-blue-600" },
        { bg: "bg-purple-100", text: "text-purple-600" },
        { bg: "bg-emerald-100", text: "text-emerald-600" },
        { bg: "bg-yellow-100", text: "text-yellow-600" },
        { bg: "bg-pink-100", text: "text-pink-600" },
        { bg: "bg-indigo-100", text: "text-indigo-600" },
    ];

    return (
        <section id="features" className="py-24 bg-[#f7f6f4]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-20 flex flex-col items-center">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0a1128] tracking-tight uppercase">
                        {content.heading}{" "}
                        <span className="text-[#0a1128]/40">{content.headingHighlight}</span>
                    </h2>
                    {content.subtitle && (
                        <p className="mt-6 text-lg sm:text-xl text-[#5b637a] font-medium max-w-2xl mx-auto leading-relaxed">
                            {content.subtitle}
                        </p>
                    )}
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {content.features?.map((feature, idx) => {
                        const IconComponent = iconMap[feature.icon] || BookOpen;
                        const color = featureColors[idx % featureColors.length];
                        return (
                            <div
                                key={idx}
                                className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-shadow duration-300 group"
                            >
                                <div className={`w-14 h-14 ${color.bg} rounded-2xl flex items-center justify-center mb-6`}>
                                    <IconComponent className={`h-7 w-7 ${color.text}`} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-xl font-bold text-[#0a1128] mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-[#5b637a] font-medium leading-relaxed">
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
