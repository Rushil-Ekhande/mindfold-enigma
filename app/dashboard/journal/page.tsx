// ============================================================================
// User Dashboard — Journal Page (Client Component)
// Calendar view — click a day to view/edit entry on dedicated page
// ============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getDaysInMonth, getMonthYear } from "@/lib/utils";
import type { JournalEntry } from "@/lib/types";

export default function JournalPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  // Get today's date string for comparison
  const today = new Date().toISOString().split("T")[0];

  // Fetch entries for the current month
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/journal?month=${monthStr}`);
    const data = await res.json();
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [monthStr]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Navigate months
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Navigate to journal entry page
  function openDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    router.push(`/dashboard/journal/${dateStr}`);
  }

  // Check if a day has an entry
  function hasEntry(day: number): JournalEntry | undefined {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return entries.find((e) => e.entry_date === dateStr);
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-foreground mb-6">Journal</h1>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-muted-bg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-muted" />
        </button>
        <h2 className="text-xl font-semibold text-foreground">
          {getMonthYear(currentDate)}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-muted-bg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-muted" />
        </button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const entry = hasEntry(day);
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === today;
            const dayName = new Date(dateStr).toLocaleDateString("en-US", {
              weekday: "short",
            });

            return (
              <button
                key={day}
                onClick={() => openDay(day)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all text-left ${
                  isToday
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : entry
                      ? "border-border bg-white hover:border-primary/30 hover:shadow-sm"
                      : "border-border bg-white hover:border-muted"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[50px]">
                    <p className="text-xs text-muted">{dayName}</p>
                    <p
                      className={`text-lg font-bold ${isToday ? "text-primary" : "text-foreground"}`}
                    >
                      {day}
                    </p>
                    {isToday && (
                      <span className="text-[10px] font-medium text-primary">
                        Today
                      </span>
                    )}
                  </div>
                  {entry ? (
                    <p className="text-sm text-muted truncate max-w-md">
                      {entry.content.slice(0, 100)}...
                    </p>
                  ) : (
                    <p className="text-sm text-muted/50 italic">No entry yet</p>
                  )}
                </div>
                {entry && entry.mental_health_score !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {entry.mental_health_score}/100
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
