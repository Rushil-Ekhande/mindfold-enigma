// ============================================================================
// Therapist Dashboard — Overview Page
// Shows key metrics: patients, rating, earnings
// ============================================================================

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Star, DollarSign } from "lucide-react";

export default async function TherapistOverviewPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    // Fetch therapist profile
    const { data: therapistProfile } = await supabase
        .from("therapist_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch profile name
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

    // Fetch active patients count
    const { count: activePatients } = await supabase
        .from("therapist_patients")
        .select("*", { count: "exact", head: true })
        .eq("therapist_id", user.id)
        .eq("is_active", true);

    // Fetch pending session requests
    const { count: pendingSessions } = await supabase
        .from("session_requests")
        .select("*", { count: "exact", head: true })
        .eq("therapist_id", user.id)
        .eq("status", "requested");

    const isVerified = therapistProfile?.verification_status === "approved";

    const metrics = [
        {
            label: "Total Patients",
            value: activePatients || 0,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
        },
        {
            label: "Rating",
            value: therapistProfile?.rating?.toFixed(1) || "0.0",
            icon: Star,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            label: "Total Earnings",
            value: `$${therapistProfile?.total_earnings?.toFixed(2) || "0.00"}`,
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
    ];

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                    Welcome, {profile?.full_name || "Doctor"}! 👋
                </h1>
                <p className="text-muted mt-1">
                    Here&apos;s your practice overview.
                </p>
            </div>

            {/* Verification Status */}
            {!isVerified && (
                <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-8">
                    <p className="text-sm text-accent font-medium">
                        ⏳ Your profile is pending verification. You&apos;ll be able to accept
                        patients once approved by our admin team.
                    </p>
                </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

            {/* Pending Sessions */}
            {(pendingSessions ?? 0) > 0 && (
                <div className="bg-white rounded-xl border border-border p-6">
                    <h2 className="font-semibold text-foreground mb-2">
                        Pending Session Requests
                    </h2>
                    <p className="text-muted text-sm">
                        You have{" "}
                        <span className="font-bold text-primary">{pendingSessions}</span>{" "}
                        pending session request(s). Visit the{" "}
                        <a href="/therapist/patients" className="text-primary hover:underline">
                            Patients
                        </a>{" "}
                        page to manage them.
                    </p>
                </div>
            )}
        </div>
    );
}
