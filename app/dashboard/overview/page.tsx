// ============================================================================
// User Dashboard — Overview Page (Server Component)
// Shows mental metrics, quick actions, and metrics graph
// ============================================================================

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Brain,
    Smile,
    Target,
    Flame,
    AlertTriangle,
    PenLine,
    MessageCircle,
    Gift,
} from "lucide-react";
import MetricsChart from "@/components/dashboard/MetricsChart";

export default async function OverviewPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    // Fetch user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

    // Fetch all journal entries to compute average metrics
    const { data: entries } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

    const allEntries = entries || [];

    // Compute average metrics
    const avgMetrics = {
        mental_health: 0,
        happiness: 0,
        accountability: 0,
        stress: 0,
        burnout_risk: 0,
    };

    if (allEntries.length > 0) {
        const scored = allEntries.filter((e) => e.mental_health_score !== null);
        if (scored.length > 0) {
            avgMetrics.mental_health = Math.round(
                scored.reduce((a, e) => a + (e.mental_health_score || 0), 0) /
                scored.length
            );
            avgMetrics.happiness = Math.round(
                scored.reduce((a, e) => a + (e.happiness_score || 0), 0) / scored.length
            );
            avgMetrics.accountability = Math.round(
                scored.reduce((a, e) => a + (e.accountability_score || 0), 0) /
                scored.length
            );
            avgMetrics.stress = Math.round(
                scored.reduce((a, e) => a + (e.stress_score || 0), 0) / scored.length
            );
            avgMetrics.burnout_risk = Math.round(
                scored.reduce((a, e) => a + (e.burnout_risk_score || 0), 0) /
                scored.length
            );
        }
    }

    // Metric cards config
    const metricCards = [
        {
            label: "Mental Health",
            value: avgMetrics.mental_health,
            icon: Brain,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
        },
        {
            label: "Happiness",
            value: avgMetrics.happiness,
            icon: Smile,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            label: "Accountability",
            value: avgMetrics.accountability,
            icon: Target,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            label: "Stress Level",
            value: avgMetrics.stress,
            icon: Flame,
            color: "text-red-600",
            bg: "bg-red-50",
        },
        {
            label: "Burnout Risk",
            value: avgMetrics.burnout_risk,
            icon: AlertTriangle,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
    ];

    // Quick actions
    const quickActions = [
        {
            label: "Write Today's Entry",
            href: "/dashboard/journal",
            icon: PenLine,
            description: "Record your thoughts and feelings",
        },
        {
            label: "Ask Journal",
            href: "/dashboard/ask-journal",
            icon: MessageCircle,
            description: "Get AI insights from your entries",
        },
        {
            label: "View Wraps",
            href: "/dashboard/journal",
            icon: Gift,
            description: "Review your monthly wellness wraps",
        },
    ];

    // Prepare chart data from last 30 entries
    const chartEntries = allEntries
        .filter((e) => e.mental_health_score !== null)
        .slice(0, 30)
        .reverse();

    const chartData = chartEntries.map((e) => ({
        date: e.entry_date,
        mental_health: e.mental_health_score || 0,
        happiness: e.happiness_score || 0,
        accountability: e.accountability_score || 0,
        stress: e.stress_score || 0,
        burnout_risk: e.burnout_risk_score || 0,
    }));

    return (
        <div className="max-w-6xl">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                    Welcome back, {profile?.full_name || "there"}! 👋
                </h1>
                <p className="text-muted mt-1">
                    Here&apos;s your mental wellness overview.
                </p>
            </div>

            {/* Section 1: Mental Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {metricCards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
                    >
                        <div
                            className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}
                        >
                            <card.icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        <p className="text-sm text-muted">{card.label}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                            {card.value}
                            <span className="text-sm font-normal text-muted">/100</span>
                        </p>
                    </div>
                ))}
            </div>

            {/* Section 2: Quick Actions */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="bg-white rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all group"
                        >
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                                <action.icon className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground">{action.label}</h3>
                            <p className="text-sm text-muted mt-1">{action.description}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Section 3: Metrics Graph */}
            <div className="bg-white rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    Wellness Trends
                </h2>
                {chartData.length > 0 ? (
                    <MetricsChart data={chartData} />
                ) : (
                    <div className="text-center py-12 text-muted">
                        <Brain className="h-12 w-12 mx-auto mb-3 text-muted/40" />
                        <p>No journal entries yet. Start writing to see your trends!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
