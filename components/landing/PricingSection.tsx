// ============================================================================
// Landing Page — Pricing Section (Dynamic)
// ============================================================================

"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING_PLANS } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PricingPlan {
    name: string;
    price: number;
    features: string[];
    highlighted?: boolean;
}

interface PricingContent {
    heading?: string;
    headingHighlight?: string;
    subtitle?: string;
    plans?: PricingPlan[];
}

export default function PricingSection() {
    const [content, setContent] = useState<PricingContent>({
        heading: "Simple, Transparent",
        headingHighlight: "Pricing",
        subtitle: "Choose the plan that works best for your wellness journey.",
        plans: PRICING_PLANS,
    });

    useEffect(() => {
        fetch("/api/landing")
            .then((res) => res.json())
            .then((sections) => {
                if (Array.isArray(sections)) {
                    const pricing = sections.find((s: { section_name: string }) => s.section_name === "pricing");
                    if (pricing?.content) {
                        setContent((prev) => ({ ...prev, ...pricing.content }));
                    }
                }
            })
            .catch((err) => console.error("Failed to load pricing content:", err));
    }, []);

    return (
        <section id="pricing" className="py-20">
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

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {content.plans?.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative p-8 rounded-2xl border-2 transition-all ${plan.highlighted
                                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-105"
                                    : "border-border bg-white hover:border-primary/30"
                                }`}
                        >
                            {/* Popular Badge */}
                            {plan.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-foreground">
                                    ${plan.price}
                                </span>
                                <span className="text-muted">/month</span>
                            </div>

                            {/* Features List */}
                            <ul className="mt-8 space-y-3">
                                {plan.features.map((feature, featureIdx) => (
                                    <li key={featureIdx} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/auth/signup"
                                className={`mt-8 block w-full text-center py-3 rounded-xl font-semibold transition-colors ${plan.highlighted
                                        ? "bg-primary text-white hover:bg-primary-dark"
                                        : "bg-muted-bg text-foreground hover:bg-primary/10"
                                    }`}
                            >
                                Get Started
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
