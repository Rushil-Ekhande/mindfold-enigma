// ============================================================================
// Wraps Client — Interactive mental health wrap summaries
// ============================================================================

"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Heart,
  Smile,
  Target,
  Flame,
  Zap,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";

interface EntryData {
  id: string;
  entry_date: string;
  mental_health_score: number | null;
  happiness_score: number | null;
  accountability_score: number | null;
  stress_score: number | null;
  burnout_risk_score: number | null;
}

interface WrapsClientProps {
  entries: EntryData[];
}

type WrapPeriod = "week" | "month" | "all";

const METRICS = [
  {
    key: "mental_health_score" as const,
    label: "Mental Health",
    icon: Heart,
    color: "text-primary",
    bg: "bg-primary/10",
    barColor: "bg-primary",
  },
  {
    key: "happiness_score" as const,
    label: "Happiness",
    icon: Smile,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    barColor: "bg-emerald-500",
  },
  {
    key: "accountability_score" as const,
    label: "Accountability",
    icon: Target,
    color: "text-blue-600",
    bg: "bg-blue-50",
    barColor: "bg-blue-500",
  },
  {
    key: "stress_score" as const,
    label: "Stress Level",
    icon: Zap,
    color: "text-red-600",
    bg: "bg-red-50",
    barColor: "bg-red-500",
  },
  {
    key: "burnout_risk_score" as const,
    label: "Burnout Risk",
    icon: Flame,
    color: "text-amber-600",
    bg: "bg-amber-50",
    barColor: "bg-amber-500",
  },
];

function getWeekRange(date: Date): { start: Date; end: Date } {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function WrapsClient({ entries }: WrapsClientProps) {
  const [period, setPeriod] = useState<WrapPeriod>("week");
  const [offset, setOffset] = useState(0);

  const { filteredEntries, periodLabel } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;
    let label: string;

    if (period === "week") {
      const ref = new Date(now);
      ref.setDate(ref.getDate() - offset * 7);
      const range = getWeekRange(ref);
      start = range.start;
      end = range.end;
      label = `${formatDateShort(start)} – ${formatDateShort(end)}`;
    } else if (period === "month") {
      const ref = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
      label = ref.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else {
      start = new Date(0);
      end = new Date();
      label = "All Time";
    }

    const filtered = entries.filter((e) => {
      const d = new Date(e.entry_date);
      return d >= start && d <= end;
    });

    return { filteredEntries: filtered, periodLabel: label };
  }, [entries, period, offset]);

  // Compute averages
  const averages = useMemo(() => {
    const result: Record<
      string,
      { avg: number; count: number; trend: number }
    > = {};

    for (const metric of METRICS) {
      const values = filteredEntries
        .map((e) => e[metric.key])
        .filter((v): v is number => v !== null);

      const avg =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;

      // Compute trend (compare first half to second half)
      let trend = 0;
      if (values.length >= 4) {
        const mid = Math.floor(values.length / 2);
        const firstHalf = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
        const secondHalf =
          values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid);
        trend = secondHalf - firstHalf;
      }

      result[metric.key] = { avg, count: values.length, trend };
    }

    return result;
  }, [filteredEntries]);

  // Best and worst days
  const bestDay = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    return filteredEntries.reduce((best, e) => {
      const score = e.mental_health_score || 0;
      return score > (best.mental_health_score || 0) ? e : best;
    });
  }, [filteredEntries]);

  const worstDay = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    return filteredEntries.reduce((worst, e) => {
      const score = e.mental_health_score || 100;
      return score < (worst.mental_health_score || 100) ? e : worst;
    });
  }, [filteredEntries]);

  // Overall wellness score
  const overallScore = useMemo(() => {
    const mh = averages.mental_health_score?.avg || 0;
    const hap = averages.happiness_score?.avg || 0;
    const acc = averages.accountability_score?.avg || 0;
    const stress = averages.stress_score?.avg || 0;
    const burnout = averages.burnout_risk_score?.avg || 0;

    if (filteredEntries.length === 0) return 0;

    // Positive metrics go up, negative (stress, burnout) go down
    return Math.round((mh + hap + acc + (100 - stress) + (100 - burnout)) / 5);
  }, [averages, filteredEntries]);

  function getScoreLabel(score: number): string {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    if (score >= 20) return "Needs Attention";
    return "Critical";
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Your Wraps</h1>
      </div>

      {/* Period Selector */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex gap-2 bg-gray-100 rounded-full p-1 w-fit">
          {(
            [
              { key: "week", label: "Weekly" },
              { key: "month", label: "Monthly" },
              { key: "all", label: "All Time" },
            ] as const
          ).map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setPeriod(p.key);
                setOffset(0);
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                period === p.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period !== "all" && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOffset(offset + 1)}
              className="p-2 rounded-lg hover:bg-muted-bg transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-muted" />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[160px] text-center flex items-center gap-2 justify-center">
              <Calendar className="h-4 w-4 text-muted" />
              {periodLabel}
            </span>
            <button
              onClick={() => setOffset(Math.max(0, offset - 1))}
              disabled={offset === 0}
              className="p-2 rounded-lg hover:bg-muted-bg transition-colors disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4 text-muted" />
            </button>
          </div>
        )}
      </div>

      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Sparkles className="h-12 w-12 text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No entries for this period
          </h2>
          <p className="text-muted text-sm">
            Start journaling to see your mental health wraps!
          </p>
        </div>
      ) : (
        <>
          {/* Overall Wellness Score */}
          <div className="bg-gradient-to-br from-primary/5 via-white to-emerald-50 rounded-2xl border border-border p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">
                  Overall Wellness Score
                </p>
                <p
                  className={`text-5xl font-bold ${getScoreColor(overallScore)}`}
                >
                  {overallScore}
                </p>
                <p className="text-sm text-muted mt-1">
                  {getScoreLabel(overallScore)} · {filteredEntries.length}{" "}
                  entries
                </p>
              </div>
              <div className="w-28 h-28 relative">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-border"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${(overallScore / 100) * 264} 264`}
                    strokeLinecap="round"
                    className={getScoreColor(overallScore)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground">
                    {overallScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {METRICS.map((metric) => {
              const data = averages[metric.key];
              if (!data) return null;
              const Icon = metric.icon;
              const isNegative =
                metric.key === "stress_score" ||
                metric.key === "burnout_risk_score";
              const trendPositive = isNegative
                ? data.trend < 0
                : data.trend > 0;

              return (
                <div
                  key={metric.key}
                  className="bg-white rounded-xl border border-border p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-9 h-9 ${metric.bg} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {metric.label}
                      </p>
                      <p className="text-xs text-muted">{data.count} entries</p>
                    </div>
                    {data.count >= 4 && (
                      <div
                        className={`flex items-center gap-1 text-xs font-medium ${
                          trendPositive
                            ? "text-emerald-600"
                            : data.trend === 0
                              ? "text-muted"
                              : "text-red-600"
                        }`}
                      >
                        {data.trend > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : data.trend < 0 ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : null}
                        {Math.abs(data.trend).toFixed(1)}
                      </div>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-muted-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full ${metric.barColor} rounded-full transition-all duration-500`}
                        style={{
                          width: `${Math.min(data.avg, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground w-10 text-right">
                      {data.avg.toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestDay && (
              <div className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Best Day
                  </h3>
                </div>
                <p className="text-lg font-bold text-emerald-600">
                  {new Date(bestDay.entry_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-muted">
                  Mental Health Score:{" "}
                  <strong>{bestDay.mental_health_score}</strong>
                </p>
              </div>
            )}
            {worstDay && (
              <div className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Needs Attention
                  </h3>
                </div>
                <p className="text-lg font-bold text-red-600">
                  {new Date(worstDay.entry_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-muted">
                  Mental Health Score:{" "}
                  <strong>{worstDay.mental_health_score}</strong>
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
