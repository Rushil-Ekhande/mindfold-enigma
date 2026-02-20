// ============================================================================
// Landing Page — How It Works Section
// ============================================================================

import { UserPlus, PenLine, Sparkles, TrendingUp } from "lucide-react";

const steps = [
    {
        icon: UserPlus,
        step: 1,
        title: "Create Your Account",
        description:
            "Sign up in seconds with just your name, email, and password. No credit card required to get started.",
    },
    {
        icon: PenLine,
        step: 2,
        title: "Write Daily Entries",
        description:
            "Journal about your day in up to 2000 characters. Our clean editor makes it easy to express your thoughts.",
    },
    {
        icon: Sparkles,
        step: 3,
        title: "Get AI Insights",
        description:
            "Our AI instantly analyzes your entry, generates a reflection, and scores 5 mental health metrics.",
    },
    {
        icon: TrendingUp,
        step: 4,
        title: "Track Your Progress",
        description:
            "Watch your metrics improve over time. Ask your journal questions and connect with therapists for deeper support.",
    },
];

export default function HowItWorksSection() {
    return (
        <section id="how-it-works" className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                        How <span className="text-primary">Mindfold</span> Works
                    </h2>
                    <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
                        Four simple steps to start your mental wellness journey.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step) => (
                        <div key={step.step} className="text-center">
                            {/* Step Number */}
                            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-primary text-white rounded-2xl mb-5 shadow-lg shadow-primary/25">
                                <step.icon className="h-7 w-7" />
                                <span className="absolute -top-2 -right-2 w-7 h-7 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {step.step}
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                {step.title}
                            </h3>
                            <p className="text-muted leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
