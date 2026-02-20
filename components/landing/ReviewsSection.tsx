// ============================================================================
// Landing Page — User Reviews Section (Dynamic)
// ============================================================================

"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";

interface Review {
    name: string;
    role: string;
    content: string;
    rating: number;
}

interface ReviewsContent {
    heading?: string;
    headingHighlight?: string;
    subtitle?: string;
    reviews?: Review[];
}

const defaultReviews: Review[] = [
    {
        name: "Sarah M.",
        role: "Daily Journaler",
        content:
            "Mindfold has completely changed how I understand my emotions. The AI reflections are surprisingly insightful — it's like having a therapist in my pocket.",
        rating: 5,
    },
    {
        name: "James L.",
        role: "Mental Health Advocate",
        content:
            "The Ask Journal feature is a game-changer. I asked why I keep procrastinating and it gave me patterns I never noticed. Highly recommend!",
        rating: 5,
    },
    {
        name: "Dr. Emily R.",
        role: "Licensed Therapist",
        content:
            "As a therapist on the platform, I love how patients can share specific entries with me. The metrics give me a head start before each session.",
        rating: 5,
    },
    {
        name: "Michael K.",
        role: "Software Engineer",
        content:
            "The burnout risk metric literally saved me. I could see my scores declining and took action before things got worse. Simple but powerful.",
        rating: 4,
    },
    {
        name: "Priya S.",
        role: "Graduate Student",
        content:
            "I love the calendar view for my journal. Being able to look back at any day and see my metrics side by side is incredibly useful.",
        rating: 5,
    },
    {
        name: "Tom H.",
        role: "Entrepreneur",
        content:
            "The deep reflect mode blew my mind. It analyzed months of entries and found patterns in my stress that I had been completely blind to.",
        rating: 5,
    },
];

export default function ReviewsSection() {
    const [content, setContent] = useState<ReviewsContent>({
        heading: "Loved by",
        headingHighlight: "Thousands",
        subtitle: "See what our users and therapists are saying about Mindfold.",
        reviews: defaultReviews,
    });

    useEffect(() => {
        fetch("/api/landing")
            .then((res) => res.json())
            .then((sections) => {
                if (Array.isArray(sections)) {
                    const reviews = sections.find((s: { section_name: string }) => s.section_name === "reviews");
                    if (reviews?.content) {
                        setContent((prev) => ({ ...prev, ...reviews.content }));
                    }
                }
            })
            .catch((err) => console.error("Failed to load reviews content:", err));
    }, []);

    return (
        <section id="reviews" className="py-24 bg-muted-bg/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                        {content.heading}{" "}
                        <span className="text-muted/30">{content.headingHighlight}</span>
                    </h2>
                    {content.subtitle && (
                        <p className="mt-6 text-lg text-muted font-medium max-w-2xl mx-auto">
                            {content.subtitle}
                        </p>
                    )}
                </div>

                {/* Review Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {content.reviews?.map((review, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-8 rounded-[2rem] border border-border/50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full"
                        >
                            <div>
                                {/* Stars */}
                                <div className="flex gap-1 mb-6">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-5 w-5 ${i < review.rating
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-border"
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Content */}
                                <p className="text-foreground font-medium leading-relaxed mb-8 text-lg">
                                    &quot;{review.content}&quot;
                                </p>
                            </div>

                            {/* Author */}
                            <div className="flex items-center gap-4 mt-auto">
                                <div className="w-12 h-12 rounded-full bg-pastel-blue flex items-center justify-center text-primary font-bold text-lg">
                                    {review.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">{review.name}</p>
                                    <p className="text-sm font-medium text-muted">{review.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
