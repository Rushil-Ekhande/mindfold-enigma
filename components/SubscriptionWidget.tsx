// "use client";

// import { useEffect, useState } from "react";
// import { Sparkles, Brain, MessageSquare, Calendar, ArrowUpRight, Loader2 } from "lucide-react";
// import Link from "next/link";

// interface SubscriptionData {
//   hasSubscription: boolean;
//   subscription: any;
//   plan: any;
//   usage: {
//     quick_reflect_used: number;
//     deep_reflect_used: number;
//     therapist_sessions_used: number;
//   };
//   limits: {
//     quick_reflect: { used: number; limit: number; remaining: number };
//     deep_reflect: { used: number; limit: number; remaining: number };
//     therapist_sessions: { used: number; limit: number; remaining: number };
//   };
// }

// export default function SubscriptionWidget() {
//   const [data, setData] = useState<SubscriptionData | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {

"use client";

import { useEffect, useState } from "react";
import { Sparkles, Brain, MessageSquare, Calendar, ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface SubscriptionData {
	hasSubscription: boolean;
	subscription: any;
	plan: any;
	usage: {
		quick_reflect_used: number;
		deep_reflect_used: number;
		therapist_sessions_used: number;
	};
	limits: {
		quick_reflect: { used: number; limit: number; remaining: number };
		deep_reflect: { used: number; limit: number; remaining: number };
		therapist_sessions: { used: number; limit: number; remaining: number };
	};
}

export default function SubscriptionWidget() {
	const [data, setData] = useState<SubscriptionData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchSubscriptionData();
	}, []);

	const fetchSubscriptionData = async () => {
		try {
			const response = await fetch("/api/subscription");
			if (response.ok) {
				const result = await response.json();
				setData(result);
			}
		} catch (error) {
			console.error("Error fetching subscription:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-xl border border-border p-6 flex items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-primary" />
			</div>
		);
	}

	if (!data?.hasSubscription || !data?.plan || data?.plan?.plan_name === 'free') {
		// User is on free plan
		return (
			<div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-6">
				<div className="flex items-start gap-4">
					<div className="bg-white p-3 rounded-lg shadow-sm">
						<Sparkles className="h-6 w-6 text-primary" />
					</div>
					<div className="flex-1">
						<h3 className="font-semibold text-gray-900 mb-2">
							Free Plan
						</h3>
						<p className="text-sm text-gray-600 mb-4">
							You have unlimited journal entries. Upgrade to unlock AI-powered insights and therapist sessions.
						</p>
						<Link
							href="/dashboard/billing"
							className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
						>
							View Plans
							<ArrowUpRight className="h-4 w-4" />
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const getProgressColor = (remaining: number, limit: number) => {
		const percentage = (remaining / limit) * 100;
		if (percentage > 50) return "bg-emerald-500";
		if (percentage > 20) return "bg-amber-500";
		return "bg-red-500";
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	return (
		<div className="space-y-4">
			{/* Plan Info */}
			<div className="bg-white rounded-xl border border-border p-6">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h3 className="font-semibold text-foreground">
							{data.plan.display_name} Plan
						</h3>
						<p className="text-sm text-muted">
							Renews {formatDate(data.subscription.current_period_end)}
						</p>
					</div>
					<div className="text-right">
						<p className="text-2xl font-bold text-foreground">
							${data.subscription.amount}
						</p>
						<p className="text-xs text-muted">
							/{data.subscription.billing_cycle}
						</p>
					</div>
				</div>
				<Link
					href="/pricing"
					className="text-sm text-primary hover:underline flex items-center gap-1"
				>
					Manage Subscription
					<ArrowUpRight className="h-3 w-3" />
				</Link>
			</div>

			{/* Usage Stats */}
			<div className="bg-white rounded-xl border border-border p-6">
				<h3 className="font-semibold text-foreground mb-4">Usage This Month</h3>
				<div className="space-y-4">
					{/* Quick Reflect */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<MessageSquare className="h-4 w-4 text-primary" />
								<span className="text-sm text-foreground">Quick Reflect</span>
							</div>
							<span className="text-sm font-semibold text-foreground">
								{data.limits.quick_reflect.used}/{data.limits.quick_reflect.limit}
							</span>
						</div>
						<div className="h-2 bg-muted-bg rounded-full overflow-hidden">
							<div
								className={`h-full ${getProgressColor(
									data.limits.quick_reflect.remaining,
									data.limits.quick_reflect.limit
								)} transition-all`}
								style={{
									width: `${
										(data.limits.quick_reflect.used /
											data.limits.quick_reflect.limit) *
										100
									}%`,
								}}
							/>
						</div>
						{data.limits.quick_reflect.remaining === 0 && (
							<p className="text-xs text-red-500 mt-1">Limit reached</p>
						)}
					</div>
					{/* Deep Reflect */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<Brain className="h-4 w-4 text-primary" />
								<span className="text-sm text-foreground">Deep Reflect</span>
							</div>
							<span className="text-sm font-semibold text-foreground">
								{data.limits.deep_reflect.used}/{data.limits.deep_reflect.limit}
							</span>
						</div>
						<div className="h-2 bg-muted-bg rounded-full overflow-hidden">
							<div
								className={`h-full ${getProgressColor(
									data.limits.deep_reflect.remaining,
									data.limits.deep_reflect.limit
								)} transition-all`}
								style={{
									width: `${
										(data.limits.deep_reflect.used /
											data.limits.deep_reflect.limit) *
										100
									}%`,
								}}
							/>
						</div>
						{data.limits.deep_reflect.remaining === 0 && (
							<p className="text-xs text-red-500 mt-1">Limit reached</p>
						)}
					</div>
					{/* Therapist Sessions */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4 text-primary" />
								<span className="text-sm text-foreground">Therapist Sessions</span>
							</div>
							<span className="text-sm font-semibold text-foreground">
								{data.limits.therapist_sessions.used}/
								{data.limits.therapist_sessions.limit} per week
							</span>
						</div>
						<div className="h-2 bg-muted-bg rounded-full overflow-hidden">
							<div
								className={`h-full ${getProgressColor(
									data.limits.therapist_sessions.remaining,
									data.limits.therapist_sessions.limit
								)} transition-all`}
								style={{
									width: `${
										(data.limits.therapist_sessions.used /
											data.limits.therapist_sessions.limit) *
										100
									}%`,
								}}
							/>
						</div>
						{data.limits.therapist_sessions.remaining === 0 && (
							<p className="text-xs text-red-500 mt-1">Weekly limit reached</p>
						)}
					</div>
				</div>

				{/* Upgrade prompt if any limit is exceeded */}
				{(data.limits.quick_reflect.remaining === 0 ||
					data.limits.deep_reflect.remaining === 0) && (
					<div className="mt-4 pt-4 border-t border-border">
						<Link
							href="/pricing"
							className="text-sm text-primary hover:underline flex items-center gap-1"
						>
							Upgrade for more usage
							<ArrowUpRight className="h-3 w-3" />
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
