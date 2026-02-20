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
  BookOpen,
  MessageCircle,
  Gift,
} from "lucide-react";
import MetricsChart from "@/components/dashboard/MetricsChart";
import MetricCard from "@/components/dashboard/MetricCard";

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
        scored.length,
      );
      avgMetrics.happiness = Math.round(
        scored.reduce((a, e) => a + (e.happiness_score || 0), 0) /
        scored.length,
      );
      avgMetrics.accountability = Math.round(
        scored.reduce((a, e) => a + (e.accountability_score || 0), 0) /
        scored.length,
      );
      avgMetrics.stress = Math.round(
        scored.reduce((a, e) => a + (e.stress_score || 0), 0) / scored.length,
      );
      avgMetrics.burnout_risk = Math.round(
        scored.reduce((a, e) => a + (e.burnout_risk_score || 0), 0) /
        scored.length,
      );
    }
  }

  // Metric cards config
  const metricCards = [
    {
      label: "Mental Health",
      value: avgMetrics.mental_health,
      iconName: "Brain",
      color: "text-purple-600",
      bg: "bg-purple-50",
      description: "Overall mental health",
    },
    {
      label: "Happiness",
      value: avgMetrics.happiness,
      iconName: "Smile",
      color: "text-green-600",
      bg: "bg-green-50",
      description: "Joy and contentment levels",
    },
    {
      label: "Stress Level",
      value: avgMetrics.stress,
      iconName: "Flame",
      color: "text-orange-600",
      bg: "bg-orange-50",
      description: "Current stress indicators",
    },
    {
      label: "Accountability",
      value: avgMetrics.accountability,
      iconName: "Target",
      color: "text-blue-600",
      bg: "bg-blue-50",
      description: "Keeping promises to yourself",
    },
    {
      label: "Burnout Risk",
      value: avgMetrics.burnout_risk,
      iconName: "AlertTriangle",
      color: "text-red-600",
      bg: "bg-red-50",
      description: "Risk of exhaustion",
    },
  ];

  // Quick actions
  const quickActions = [
    {
      label: "Write Entry",
      href: "/dashboard/journal",
      icon: BookOpen,
      description: "Reflect on your day",
    },
    {
      label: "Ask Mirror",
      href: "/dashboard/ask-journal",
      icon: MessageCircle,
      description: "Chat with your journal",
    },
    {
      label: "View Wraps",
      href: "/dashboard/journal",
      icon: Gift,
      description: "Analyze your trends",
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

  // Mood emoji based on average metrics
  function getMoodEmoji(metrics) {
    if (metrics.happiness >= 70 && metrics.mental_health >= 70) return "😄";
    if (metrics.stress >= 70 || metrics.burnout_risk >= 70) return "😰";
    if (metrics.happiness <= 30) return "😢";
    if (metrics.mental_health <= 30) return "😔";
    if (metrics.accountability >= 70) return "💪";
    return "🙂";
  }
  const moodEmoji = getMoodEmoji(avgMetrics);

  return (
    <div className="max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">How You Are</h1>
          <span className="px-3 py-1 bg-primary/10 text-primary text-xl font-medium rounded-full border border-primary/20">
            {moodEmoji}
          </span>
        </div>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Your mental health snapshot based on your journal entries
        </p>
      </div>

      {/* Section 1: Mental Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {metricCards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            iconName={card.iconName}
            color={card.color}
            bg={card.bg}
            description={card.description}
          />
        ))}
      </div>

      {/* Section 2: Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:border-gray-300 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                  <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                </div>
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                {action.label}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Section 3: Metrics Graph */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Wellness Trends
        </h2>
        {chartData.length > 0 ? (
          <MetricsChart data={chartData} />
        ) : (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            <Brain className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
            <p className="text-sm sm:text-base">
              No journal entries yet. Start writing to see your trends!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
