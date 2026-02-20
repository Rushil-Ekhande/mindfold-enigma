// ============================================================================
// Admin Dashboard — Overview Page
// Shows platform-wide stats: total users, therapists, pending verifications
// ============================================================================

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, UserCheck, Clock, BookOpen } from "lucide-react";

export default async function AdminOverviewPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    // Fetch stats via admin API
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/stats`,
        {
            headers: { Cookie: "" },
            cache: "no-store",
        }
    );

    // Fallback: fetch directly if API call fails
    const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "user");

    const { count: totalTherapists } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "therapist");

    const { count: pendingVerifications } = await supabase
        .from("therapist_profiles")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending");

    const { count: totalEntries } = await supabase
        .from("journal_entries")
        .select("*", { count: "exact", head: true });

    const metrics = [
        {
            label: "Total Users",
            value: totalUsers || 0,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
        },
        {
            label: "Total Therapists",
            value: totalTherapists || 0,
            icon: UserCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            label: "Pending Verifications",
            value: pendingVerifications || 0,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            label: "Total Journal Entries",
            value: totalEntries || 0,
            icon: BookOpen,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
    ];

    return (
        <div className="max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
                <p className="text-muted mt-1">Platform statistics at a glance.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metrics.map((metric) => (
                    <div
                        key={metric.label}
                        className="bg-white rounded-xl border border-border p-6"
                    >
                        <div
                            className={`w-10 h-10 ${metric.bg} rounded-lg flex items-center justify-center mb-3`}
                        >
                            <metric.icon className={`h-5 w-5 ${metric.color}`} />
                        </div>
                        <p className="text-sm text-muted">{metric.label}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                            {metric.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <a
                        href="/admin/therapists"
                        className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                    >
                        Review Therapists
                    </a>
                    <a
                        href="/admin/landing"
                        className="bg-muted-bg text-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-muted-bg/70 transition-colors"
                    >
                        Edit Landing Page
                    </a>
                </div>
            </div>
        </div>
    );
}
