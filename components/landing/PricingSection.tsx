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
        <section id="pricing" className="py-24 bg-[#f7f6f4] relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-20 flex flex-col items-center">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#0a1128] uppercase">
                        {content.heading}{" "}
                        <span className="text-[#0a1128]/40">{content.headingHighlight}</span>
                    </h2>
                    {content.subtitle && (
                        <p className="mt-6 text-lg sm:text-xl text-[#5b637a] font-medium max-w-2xl mx-auto leading-relaxed">
                            {content.subtitle}
                        </p>
                    )}
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-end">
                    {content.plans?.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative p-8 lg:p-10 rounded-[2rem] transition-all duration-300 ${plan.highlighted
                                ? "border-2 border-[#0a1128] bg-white shadow-2xl shadow-black/10 z-10 scale-100 md:scale-105"
                                : "border border-black/5 bg-white hover:border-black/20 hover:shadow-lg shadow-sm"
                                }`}
                        >
                            {/* Popular Badge */}
                            {plan.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0a1128] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-[#0a1128] mb-4">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-5xl font-bold tracking-tight text-[#0a1128]">
                                    ${plan.price}
                                </span>
                                <span className="text-[#5b637a] font-medium">/mo</span>
                            </div>

                            {/* Features List */}
                            <ul className="mb-8 space-y-4 flex-grow">
                                {plan.features.map((feature, featureIdx) => (
                                    <li key={featureIdx} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#0a1128]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check className="h-3 w-3 text-[#0a1128] stroke-[3]" />
                                        </div>
                                        <span className="text-sm font-medium text-[#0a1128]">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/auth/signup"
                                className={`block w-full text-center py-3.5 rounded-full font-semibold transition-colors ${plan.highlighted
                                    ? "bg-[#0a1128] text-white hover:bg-black"
                                    : "bg-gray-100 text-[#0a1128] hover:bg-gray-200"
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
