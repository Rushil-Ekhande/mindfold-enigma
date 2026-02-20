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
  const isRejected = therapistProfile?.verification_status === "rejected";
  const isPending = therapistProfile?.verification_status === "pending";
  const canResubmit = therapistProfile?.can_resubmit ?? true;
  const rejectionCount = therapistProfile?.rejection_count || 0;

  // Fetch reviews to compute real rating
  const { data: reviews } = await supabase
    .from("therapist_reviews")
    .select("rating")
    .eq("therapist_id", user.id);

  let computedRating = therapistProfile?.rating || 0;
  const reviewCount = reviews?.length || 0;
  if (reviews && reviews.length > 0) {
    computedRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    // Sync the rating to therapist_profiles
    await supabase
      .from("therapist_profiles")
      .update({ rating: parseFloat(computedRating.toFixed(2)) })
      .eq("id", user.id);
  }

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
      value: `${computedRating.toFixed(1)} (${reviewCount})`,
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total Earnings",
      value: `${therapistProfile?.total_earnings?.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {profile?.full_name || "Doctor"}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Here&apos;s your practice overview for today.
        </p>
      </div>

      {/* Verification Status */}
      {isPending && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl">⏳</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-1">
                Verification Pending
              </h3>
              <p className="text-amber-800">
                Your profile is under review by our admin team. You&apos;ll be
                able to accept patients once approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Alert */}
      {isRejected && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Application Rejected
              </h3>
              <p className="text-red-800 mb-4">
                {therapistProfile?.rejection_reason ||
                  "Your application has been rejected."}
              </p>
              {canResubmit ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 bg-red-100 px-3 py-1.5 rounded-full">
                    <span className="text-xs font-semibold text-red-700">
                      Attempts: {rejectionCount}/3
                    </span>
                  </div>
                  <div>
                    <a
                      href="/therapist/reverification"
                      className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-red-700 transition-all hover:shadow-lg"
                    >
                      Re-submit Documents
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-900 font-semibold">
                    ❌ Maximum rejection limit reached (3/3). You cannot
                    resubmit documents at this time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all group"
          >
            <div
              className={`w-14 h-14 ${metric.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              <metric.icon className={`h-7 w-7 ${metric.color}`} />
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">
              {metric.label}
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {metric.label === "Total Earnings" && "$"}
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pending Sessions */}
      {(pendingSessions ?? 0) > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl">📅</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Pending Session Requests
              </h2>
              <p className="text-gray-700 mb-4">
                You have{" "}
                <span className="font-bold text-blue-600 text-lg">
                  {pendingSessions}
                </span>{" "}
                pending session request(s) waiting for your response.
              </p>
              <a
                href="/therapist/patients"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all hover:shadow-lg"
              >
                Manage Requests
                <svg
                  className="h-4 w-4"
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
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
