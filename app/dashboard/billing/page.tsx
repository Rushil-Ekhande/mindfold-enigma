"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2, Sparkles, Crown, ArrowRight, CheckCircle } from "lucide-react";

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
        id: "free",
        name: "free",
        displayName: "Free",
        price: 0,
        yearlyPrice: 0,
        description: "Start your mental health journey with basic journaling",
        features: [
            "Unlimited journal entries",
            "View your entries anytime",
            "Basic mental health tracking",
            "No AI features included",
        ],
    },
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
            "Therapist included - 2 sessions per week",
        ],
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
            "Therapist included - 3 sessions per week",
        ],
        highlighted: true,
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
            "Therapist included - 4 sessions per week",
        ],
    },
];

export default function BillingPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            }
        >
            <BillingContent />
        </Suspense>
    );
}

function BillingContent() {
    const searchParams = useSearchParams();
    const session = searchParams.get("session");
    const subscriptionId = searchParams.get("subscription_id");

    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [currentPlan, setCurrentPlan] = useState<string>("free");
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        async function initialize() {
            if (session === "success") {
                // Attempt instant activation
                try {
                    const activateRes = await fetch("/api/subscription/activate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            subscriptionId: subscriptionId ?? null,
                            billingCycle,
                        }),
                    });

                    if (activateRes.ok) {
                        const data = await activateRes.json();
                        const plan = data.plan ?? "basic";
                        setCurrentPlan(plan);
                        setSuccessMessage(
                            `🎉 Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan is now active!`
                        );
                    } else {
                        setSuccessMessage("✅ Payment received! Activating your subscription...");
                        await loadCurrentSubscription();
                    }
                } catch {
                    setSuccessMessage("✅ Payment received! Activating your subscription...");
                    await loadCurrentSubscription();
                }
            } else {
                await loadCurrentSubscription();
            }
            setLoading(false);
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, subscriptionId]);

    async function loadCurrentSubscription() {
        try {
            const res = await fetch("/api/subscription");
            if (res.ok) {
                const data = await res.json();
                if (data.subscription?.plan_name) {
                    setCurrentPlan(data.subscription.plan_name);
                }
            }
        } catch (err) {
            console.error("Failed to load subscription:", err);
        }
    }

    async function handleSubscribe(planId: string) {
        if (planId === "free") return;

        setLoadingPlan(planId);
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId, billingCycle }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error ?? "Checkout failed");
            }

            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert(`Failed to start checkout: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setLoadingPlan(null);
        }
    }

    function getPrice(plan: Plan) {
        return billingCycle === "monthly" ? plan.price : plan.yearlyPrice / 12;
    }

    function getSavings(plan: Plan) {
        return plan.price * 12 - plan.yearlyPrice;
    }

    function isPlanActive(planId: string) {
        return currentPlan === planId;
    }

    function getButtonText(planId: string) {
        if (isPlanActive(planId)) return "Current Plan";
        if (planId === "free") return "Free Forever";
        return "Upgrade Now";
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Success Banner */}
                {successMessage && (
                    <div className="mb-8 flex items-center gap-3 px-6 py-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 shadow-sm">
                        <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                        <span className="font-semibold text-lg">{successMessage}</span>
                    </div>
                )}

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
                        <Crown className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                        Start with unlimited journaling, or upgrade for AI-powered insights and therapist sessions
                    </p>

                    {/* Current Plan Badge */}
                    {currentPlan && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-medium">
                            <Sparkles className="w-4 h-4" />
                            Current Plan: {plans.find(p => p.id === currentPlan)?.displayName || currentPlan}
                        </div>
                    )}

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium ${billingCycle === "monthly" ? "text-gray-900" : "text-gray-500"}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${billingCycle === "yearly" ? "bg-primary" : "bg-gray-200"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
                                    }`}
                            />
                        </button>
                        <span className={`text-sm font-medium ${billingCycle === "yearly" ? "text-gray-900" : "text-gray-500"}`}>
                            Yearly
                            <span className="ml-2 text-xs text-green-600 font-semibold">Save up to 17%</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {plans.map((plan) => {
                        const isActive = isPlanActive(plan.id);
                        const isHighlighted = plan.highlighted;

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl border-2 p-8 transition-all duration-200 ${isActive
                                    ? "border-blue-500 bg-blue-50 shadow-lg"
                                    : isHighlighted
                                        ? "border-primary bg-primary/5 shadow-xl scale-105"
                                        : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-lg"
                                    }`}
                            >
                                {/* Best Value Badge */}
                                {isHighlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="inline-flex items-center gap-1 px-4 py-1 bg-primary text-white text-sm font-semibold rounded-full shadow-lg">
                                            <Sparkles className="w-3 h-3" />
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Current Plan Badge */}
                                {isActive && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="inline-flex items-center gap-1 px-4 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full shadow-lg">
                                            <Check className="w-3 h-3" />
                                            Active
                                        </span>
                                    </div>
                                )}

                                {/* Plan Name */}
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {plan.displayName}
                                </h3>

                                {/* Price */}
                                <div className="mb-4">
                                    {plan.price === 0 ? (
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-gray-900">$0</span>
                                            <span className="text-gray-500">/month</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-bold text-gray-900">
                                                    ${getPrice(plan).toFixed(2)}
                                                </span>
                                                <span className="text-gray-500">/month</span>
                                            </div>
                                            {billingCycle === "yearly" && (
                                                <p className="text-sm text-green-600 font-medium mt-1">
                                                    Save ${getSavings(plan).toFixed(2)}/year
                                                </p>
                                            )}
                                            {billingCycle === "monthly" && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    or ${plan.yearlyPrice}/year
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-gray-600 text-sm mb-6">
                                    {plan.description}
                                </p>

                                {/* CTA Button */}
                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={isActive || loadingPlan === plan.id || plan.id === "free"}
                                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${isActive
                                        ? "bg-blue-100 text-blue-700 cursor-not-allowed"
                                        : plan.id === "free"
                                            ? "bg-gray-100 text-gray-500 cursor-default"
                                            : isHighlighted
                                                ? "bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl"
                                                : "bg-gray-900 text-white hover:bg-gray-800"
                                        }`}
                                >
                                    {loadingPlan === plan.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            {getButtonText(plan.id)}
                                            {!isActive && plan.id !== "free" && <ArrowRight className="w-4 h-4" />}
                                        </>
                                    )}
                                </button>

                                {/* Features List */}
                                <div className="mt-8 space-y-4">
                                    <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                                        What&apos;s Included:
                                    </p>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                <span className="text-sm text-gray-600">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ or Additional Info */}
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Questions About Billing?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        All paid plans include a 7-day money-back guarantee. You can upgrade, downgrade, or cancel at any time.
                    </p>
                    <p className="text-sm text-gray-500">
                        Payments are securely processed by Dodo Payments. Your card information is never stored on our servers.
                    </p>
                </div>
            </div>
        </div>
    );
}
