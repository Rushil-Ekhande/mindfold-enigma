"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanFeature {
    text: string;
    included: boolean;
}

interface Plan {
    id: string;
    name: string;
    displayName: string;
    price: number;
    yearlyPrice: number;
    description: string;
    features: string[];
    highlighted?: boolean;
}

const plans: Plan[] = [
    {
        id: "basic",
        name: "basic",
        displayName: "Basic",
        price: 9.99,
        yearlyPrice: 99.99,
        description: "Perfect for getting started with mental health tracking",
        features: [
            "Write journal entries and reflect for the whole month",
            "15 requests of quick reflect",
            "5 requests of deep reflect",
            "Monthly wrap report",
            "Therapist included - 2 sessions per week"
        ]
    },
    {
        id: "intermediate",
        name: "intermediate",
        displayName: "Intermediate",
        price: 19.99,
        yearlyPrice: 199.99,
        description: "Great for consistent mental health practice",
        features: [
            "Write journal entries and reflect for the whole month",
            "25 requests of quick reflect",
            "10 requests of deep reflect",
            "Monthly wrap report",
            "Therapist included - 3 sessions per week"
        ],
        highlighted: true
    },
    {
        id: "advanced",
        name: "advanced",
        displayName: "Advanced",
        price: 29.99,
        yearlyPrice: 299.99,
        description: "Comprehensive support for your mental health journey",
        features: [
            "Write journal entries and reflect for the whole month",
            "30 requests of quick reflect",
            "15 requests of deep reflect",
            "Monthly wrap report",
            "Therapist included - 4 sessions per week"
        ]
    }
];

export default function PricingPage() {
    const router = useRouter();
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleSubscribe = async (planId: string) => {
        setLoadingPlan(planId);

        try {
            // Create checkout session
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    planId,
                    billingCycle,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create checkout session");
            }

            const data = await response.json();

            // Redirect to Dodo Payments checkout
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
            alert("Failed to start checkout. Please try again.");
        } finally {
            setLoadingPlan(null);
        }
    };

    const getPrice = (plan: Plan) => {
        return billingCycle === "monthly" ? plan.price : plan.yearlyPrice / 12;
    };

    const getSavings = (plan: Plan) => {
        const monthlyCost = plan.price * 12;
        const yearlyCost = plan.yearlyPrice;
        return monthlyCost - yearlyCost;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-muted max-w-2xl mx-auto mb-8">
                        Start your mental health journey with the perfect plan for you
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all ${billingCycle === "monthly"
                                    ? "bg-primary text-white"
                                    : "bg-white text-muted border border-border hover:border-primary"
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all relative ${billingCycle === "yearly"
                                    ? "bg-primary text-white"
                                    : "bg-white text-muted border border-border hover:border-primary"
                                }`}
                        >
                            Yearly
                            <span className="absolute -top-2 -right-2 bg-accent text-white text-xs px-2 py-1 rounded-full">
                                Save 17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-xl ${plan.highlighted
                                    ? "border-primary shadow-lg scale-105"
                                    : "border-border hover:border-primary"
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Most Popular
                                </div>
                            )}

                            <div className="p-8">
                                {/* Plan Header */}
                                <h3 className="text-2xl font-bold text-foreground mb-2">
                                    {plan.displayName}
                                </h3>
                                <p className="text-muted text-sm mb-6">
                                    {plan.description}
                                </p>

                                {/* Pricing */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-foreground">
                                            ${getPrice(plan).toFixed(2)}
                                        </span>
                                        <span className="text-muted">/month</span>
                                    </div>
                                    {billingCycle === "yearly" && (
                                        <p className="text-sm text-accent mt-2">
                                            Save ${getSavings(plan).toFixed(2)}/year
                                        </p>
                                    )}
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => handleSubscribe(plan.name)}
                                    disabled={loadingPlan === plan.name}
                                    className={`w-full py-3 rounded-lg font-semibold transition-all mb-6 flex items-center justify-center gap-2 ${plan.highlighted
                                            ? "bg-primary text-white hover:bg-primary-dark"
                                            : "bg-muted-bg text-foreground hover:bg-primary hover:text-white"
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {loadingPlan === plan.name ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Get Started"
                                    )}
                                </button>

                                {/* Features List */}
                                <div className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-foreground">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-16 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-foreground text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-border p-6">
                            <h3 className="font-semibold text-foreground mb-2">
                                Can I change my plan later?
                            </h3>
                            <p className="text-muted text-sm">
                                Yes! You can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-border p-6">
                            <h3 className="font-semibold text-foreground mb-2">
                                What happens if I exceed my limits?
                            </h3>
                            <p className="text-muted text-sm">
                                You'll be notified when you're close to your limits. You can upgrade your plan or wait until your next billing cycle for the limits to reset.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-border p-6">
                            <h3 className="font-semibold text-foreground mb-2">
                                Can I cancel anytime?
                            </h3>
                            <p className="text-muted text-sm">
                                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
