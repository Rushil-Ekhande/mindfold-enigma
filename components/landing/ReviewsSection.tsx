// ============================================================================
// Landing Page — User Reviews Section
// ============================================================================

import { Star } from "lucide-react";

const reviews = [
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
    return (
        <section id="reviews" className="py-20 bg-muted-bg/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                        Loved by <span className="text-primary">Thousands</span>
                    </h2>
                    <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
                        See what our users and therapists are saying about Mindfold.
                    </p>
                </div>

                {/* Review Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reviews.map((review) => (
                        <div
                            key={review.name}
                            className="bg-white p-6 rounded-2xl border border-border hover:shadow-md transition-shadow"
                        >
                            {/* Stars */}
                            <div className="flex gap-1 mb-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < review.rating
                                                ? "text-accent fill-accent"
                                                : "text-border"
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Content */}
                            <p className="text-foreground leading-relaxed mb-4">
                                &quot;{review.content}&quot;
                            </p>

                            {/* Author */}
                            <div>
                                <p className="font-semibold text-foreground">{review.name}</p>
                                <p className="text-sm text-muted">{review.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
