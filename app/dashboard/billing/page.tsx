// ============================================================================
// User Dashboard — Billing Page
// Displays subscription plans and transaction history
// ============================================================================

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Check, CreditCard } from "lucide-react";
import { PRICING_PLANS } from "@/lib/utils";

export default async function BillingPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    // Fetch user's current plan
    const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("subscription_plan, subscription_start_date, subscription_end_date")
        .eq("id", user.id)
        .single();

    // Fetch billing transactions
    const { data: transactions } = await supabase
        .from("billing_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

    const currentPlan = userProfile?.subscription_plan || "basic";

    return (
        <div className="max-w-5xl">
            <h1 className="text-2xl font-bold text-foreground mb-6">Billing</h1>

            {/* Current Plan */}
            <div className="bg-white rounded-xl border border-border p-6 mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">
                        Current Plan
                    </h2>
                </div>
                <p className="text-muted">
                    You are on the{" "}
                    <span className="font-semibold text-primary capitalize">
                        {currentPlan}
                    </span>{" "}
                    plan.
                </p>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {PRICING_PLANS.map((plan) => {
                    const isCurrentPlan = plan.plan === currentPlan;
                    return (
                        <div
                            key={plan.name}
                            className={`relative p-6 rounded-xl border-2 transition-all ${plan.highlighted
                                    ? "border-primary bg-primary/5 shadow-lg"
                                    : "border-border bg-white"
                                } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
                        >
                            {isCurrentPlan && (
                                <div className="absolute -top-3 left-4 bg-primary text-white text-xs font-bold px-3 py-0.5 rounded-full">
                                    Current
                                </div>
                            )}
                            <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                            <div className="mt-3 flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-foreground">
                                    ${plan.price}
                                </span>
                                <span className="text-muted text-sm">/month</span>
                            </div>
                            <ul className="mt-5 space-y-2">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2 text-sm">
                                        <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                                        <span className="text-foreground">{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                disabled={isCurrentPlan}
                                className={`mt-5 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${isCurrentPlan
                                        ? "bg-muted-bg text-muted cursor-default"
                                        : "bg-primary text-white hover:bg-primary-dark"
                                    }`}
                            >
                                {isCurrentPlan ? "Current Plan" : "Upgrade"}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="p-5 border-b border-border">
                    <h2 className="font-semibold text-foreground">Transaction History</h2>
                </div>
                {!transactions || transactions.length === 0 ? (
                    <div className="p-8 text-center text-muted">
                        No transactions yet.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs font-medium text-muted border-b border-border">
                                <th className="px-5 py-3">Date</th>
                                <th className="px-5 py-3">Description</th>
                                <th className="px-5 py-3">Amount</th>
                                <th className="px-5 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((t) => (
                                <tr key={t.id} className="border-b border-border last:border-0">
                                    <td className="px-5 py-3 text-sm text-muted">
                                        {new Date(t.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-foreground">
                                        {t.description || t.transaction_type}
                                    </td>
                                    <td className="px-5 py-3 text-sm font-medium text-foreground">
                                        ${t.amount}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`text-xs font-medium px-2 py-1 rounded-full ${t.status === "completed"
                                                    ? "bg-success/10 text-success"
                                                    : t.status === "pending"
                                                        ? "bg-accent/10 text-accent"
                                                        : "bg-danger/10 text-danger"
                                                }`}
                                        >
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
