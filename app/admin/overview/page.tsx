// ============================================================================
// Admin Dashboard — Enhanced Overview Page with Real Analytics
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import {
    Users,
    UserCheck,
    Clock,
    BookOpen,
    DollarSign,
    TrendingUp,
    Activity,
    CreditCard,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
    totalUsers: number;
    totalTherapists: number;
    pendingVerifications: number;
    totalEntries: number;
    totalRevenue: number;
    subscriptionRevenue: number;
    therapistEarnings: number;
    activeSubscriptions: number;
    userGrowth: Array<{ date: string; count: number }>;
    revenueByMonth: Array<{ month: string; amount: number }>;
    topTherapists: Array<{ name: string; earnings: number; sessions: number }>;
    recentTransactions: Array<{
        id: string;
        user: string;
        amount: number;
        type: string;
        date: string;
    }>;
    changes: {
        users: number;
        therapists: number;
        revenue: number;
        subscriptions: number;
        entries: number;
        subscriptionRevenue: number;
        therapistEarnings: number;
        pendingVerifications: number;
    };
}

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

    useEffect(() => {
        fetchStats();
    }, [timeRange]);

    async function fetchStats() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/analytics?range=${timeRange}`, { cache: "no-store" });
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-muted">Failed to load dashboard statistics</p>
            </div>
        );
    }

    const formatChange = (change: number) => {
        if (change === 0) return "0%";
        const sign = change > 0 ? "+" : "";
        return `${sign}${change}%`;
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return "text-success";
        if (change < 0) return "text-danger";
        return "text-muted";
    };

    const metrics = [
        {
            label: "Total Users",
            value: stats.totalUsers,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            change: stats.changes.users,
        },
        {
            label: "Total Therapists",
            value: stats.totalTherapists,
            icon: UserCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            change: stats.changes.therapists,
        },
        {
            label: "Total Revenue",
            value: `$${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-50",
            change: stats.changes.revenue,
        },
        {
            label: "Active Subscriptions",
            value: stats.activeSubscriptions,
            icon: CreditCard,
            color: "text-blue-600",
            bg: "bg-blue-50",
            change: stats.changes.subscriptions,
        },
        {
            label: "Pending Verifications",
            value: stats.pendingVerifications,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
            change: stats.changes.pendingVerifications,
        },
        {
            label: "Total Entries",
            value: stats.totalEntries.toLocaleString(),
            icon: BookOpen,
            color: "text-purple-600",
            bg: "bg-purple-50",
            change: stats.changes.entries,
        },
        {
            label: "Subscription Revenue",
            value: `$${stats.subscriptionRevenue.toLocaleString()}`,
            icon: TrendingUp,
            color: "text-cyan-600",
            bg: "bg-cyan-50",
            change: stats.changes.subscriptionRevenue,
        },
        {
            label: "Therapist Earnings",
            value: `$${stats.therapistEarnings.toLocaleString()}`,
            icon: Activity,
            color: "text-pink-600",
            bg: "bg-pink-50",
            change: stats.changes.therapistEarnings,
        },
    ];

    const quickActions = [
        {
            label: "View All Users",
            href: "/admin/users",
            icon: Users,
            description: "Manage user accounts",
        },
        {
            label: "Review Therapists",
            href: "/admin/therapists",
            icon: UserCheck,
            description: "Verify therapist applications",
        },
        {
            label: "View Transactions",
            href: "/admin/transactions",
            icon: DollarSign,
            description: "Monitor financial activity",
        },
        {
            label: "Edit Landing Page",
            href: "/admin/landing",
            icon: Activity,
            description: "Update website content",
        },
    ];

    return (
        <div className="max-w-7xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                    <p className="text-muted mt-1">
                        Comprehensive platform analytics and insights
                    </p>
                </div>
                <div className="flex gap-2">
                    {(["7d", "30d", "90d", "1y"] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                timeRange === range
                                    ? "bg-primary text-white"
                                    : "bg-white text-muted border border-border hover:bg-muted-bg/50"
                            }`}
                        >
                            {range === "7d" && "7 Days"}
                            {range === "30d" && "30 Days"}
                            {range === "90d" && "90 Days"}
                            {range === "1y" && "1 Year"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Platform Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div
                                    className={`w-12 h-12 ${metric.bg} rounded-lg flex items-center justify-center`}
                                >
                                    <metric.icon className={`h-6 w-6 ${metric.color}`} />
                                </div>
                                <span className={`text-xs font-medium ${getChangeColor(metric.change)}`}>
                                    {formatChange(metric.change)}
                                </span>
                            </div>
                            <p className="text-sm text-muted mb-1">{metric.label}</p>
                            <p className="text-2xl font-bold text-foreground">
                                {metric.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions - Moved to middle with clear separation */}
            <div className="mb-8 bg-linear-to-br from-primary/5 to-indigo-50 rounded-2xl p-6 border border-primary/10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="bg-white rounded-xl border border-border p-5 hover:border-primary/50 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                                    <action.icon className="h-6 w-6 text-gray-700" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-1">
                                {action.label}
                            </h3>
                            <p className="text-sm text-muted">
                                {action.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Growth Chart */}
                <div className="bg-white rounded-xl border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4">User Growth</h3>
                    <div className="h-64">
                        <SimpleLineChart data={stats.userGrowth} />
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className="bg-white rounded-xl border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4">
                        Revenue by Month
                    </h3>
                    <div className="h-64">
                        <SimpleBarChart data={stats.revenueByMonth} />
                    </div>
                </div>
            </div>

            {/* Revenue Breakdown & Top Therapists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4">
                        Revenue Breakdown
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted">Subscriptions</span>
                                <span className="font-medium text-foreground">
                                    ${stats.subscriptionRevenue.toLocaleString()}
                                </span>
                            </div>
                            <div className="w-full bg-muted-bg rounded-full h-2.5">
                                <div
                                    className="bg-primary h-2.5 rounded-full transition-all"
                                    style={{
                                        width: `${
                                            (stats.subscriptionRevenue / stats.totalRevenue) *
                                            100
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted">Therapist Payments</span>
                                <span className="font-medium text-foreground">
                                    ${stats.therapistEarnings.toLocaleString()}
                                </span>
                            </div>
                            <div className="w-full bg-muted-bg rounded-full h-2.5">
                                <div
                                    className="bg-emerald-500 h-2.5 rounded-full transition-all"
                                    style={{
                                        width: `${
                                            (stats.therapistEarnings / stats.totalRevenue) * 100
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Therapists */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4">
                        Top Earning Therapists
                    </h3>
                    <div className="space-y-3">
                        {stats.topTherapists.map((therapist, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-muted-bg/30 rounded-lg hover:bg-muted-bg/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-bold text-primary">
                                            #{idx + 1}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {therapist.name}
                                        </p>
                                        <p className="text-xs text-muted">
                                            {therapist.sessions} sessions
                                        </p>
                                    </div>
                                </div>
                                <span className="font-semibold text-foreground">
                                    ${therapist.earnings.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Recent Transactions</h3>
                    <Link
                        href="/admin/transactions"
                        className="text-sm text-primary hover:underline"
                    >
                        View All
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                    User
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                    Type
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                    Amount
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentTransactions.map((transaction) => (
                                <tr key={transaction.id} className="border-b border-border hover:bg-muted-bg/30 transition-colors">
                                    <td className="py-3 px-4 text-sm text-foreground">
                                        {transaction.user}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                transaction.type === "subscription"
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "bg-green-50 text-green-700"
                                            }`}
                                        >
                                            {transaction.type}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm font-medium text-foreground">
                                        ${transaction.amount.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Simple Line Chart Component
function SimpleLineChart({ data }: { data: Array<{ date: string; count: number }> }) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted">No data</div>;
    }

    const maxValue = Math.max(...data.map((d) => d.count));
    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * 100,
        y: 100 - (d.count / maxValue) * 80,
    }));

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return (
        <div className="relative w-full h-full">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                    d={pathD}
                    fill="none"
                    stroke="rgb(99, 102, 241)"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                />
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="1.5"
                        fill="rgb(99, 102, 241)"
                        vectorEffect="non-scaling-stroke"
                    />
                ))}
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted px-2">
                {data.map((d, i) => (
                    <span key={i}>{d.date}</span>
                ))}
            </div>
        </div>
    );
}

// Simple Bar Chart Component
function SimpleBarChart({ data }: { data: Array<{ month: string; amount: number }> }) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted">No data</div>;
    }

    const maxValue = Math.max(...data.map((d) => d.amount));

    return (
        <div className="flex items-end justify-between h-full gap-2 px-4">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-primary/20 rounded-t-lg relative" style={{ height: "100%" }}>
                        <div
                            className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all"
                            style={{ height: `${(d.amount / maxValue) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted">{d.month}</span>
                </div>
            ))}
        </div>
    );
}
