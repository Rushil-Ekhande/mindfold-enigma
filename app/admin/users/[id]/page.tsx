// ============================================================================
// Admin Dashboard — Individual User Detail Page
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    User,
    Mail,
    Calendar,
    CreditCard,
    BookOpen,
    TrendingUp,
    DollarSign,
    Activity,
} from "lucide-react";
import Link from "next/link";

interface UserDetail {
    id: string;
    full_name: string;
    email: string;
    created_at: string;
    subscription_plan: string;
    subscription_start_date: string | null;
    subscription_end_date: string | null;
    total_entries: number;
    avg_mental_health: number;
    avg_happiness: number;
    avg_stress: number;
    avg_burnout: number;
    total_spent: number;
    recent_transactions: Array<{
        id: string;
        amount: number;
        type: string;
        date: string;
    }>;
    entry_stats: Array<{
        date: string;
        count: number;
    }>;
}

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchUserDetail();
        }
    }, [userId]);

    async function fetchUserDetail() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { cache: "no-store" });
            if (!res.ok) {
                console.error("Failed to fetch user details");
                return;
            }
            const data = await res.json();
            setUser(data);
        } catch (error) {
            console.error("Error fetching user details:", error);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <p className="text-muted">User not found</p>
                <Link
                    href="/admin/users"
                    className="text-primary hover:underline mt-4 inline-block"
                >
                    Back to Users
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted hover:text-foreground mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Users
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{user.full_name}</h1>
                        <p className="text-muted">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-muted">Total Entries</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{user.total_entries}</p>
                </div>

                <div className="bg-white rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm text-muted">Avg Mental Health</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        {user.avg_mental_health.toFixed(1)}/10
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                            <Activity className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-sm text-muted">Avg Happiness</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        {user.avg_happiness.toFixed(1)}/10
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-sm text-muted">Total Spent</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        ${user.total_spent.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* User Info & Subscription */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Information */}
                <div className="bg-white rounded-xl border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4">User Information</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted" />
                            <div>
                                <p className="text-xs text-muted">Email</p>
                                <p className="text-sm text-foreground">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted" />
                            <div>
                                <p className="text-xs text-muted">Member Since</p>
                                <p className="text-sm text-foreground">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted" />
                            <div>
                                <p className="text-xs text-muted">User ID</p>
                                <p className="text-sm text-foreground font-mono">{user.id}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription Info */}
                <div className="bg-white rounded-xl border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4">Subscription</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 text-muted" />
                            <div>
                                <p className="text-xs text-muted">Plan</p>
                                <p className="text-sm text-foreground capitalize">
                                    {user.subscription_plan}
                                </p>
                            </div>
                        </div>
                        {user.subscription_start_date && (
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted" />
                                <div>
                                    <p className="text-xs text-muted">Start Date</p>
                                    <p className="text-sm text-foreground">
                                        {new Date(user.subscription_start_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}
                        {user.subscription_end_date && (
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted" />
                                <div>
                                    <p className="text-xs text-muted">End Date</p>
                                    <p className="text-sm text-foreground">
                                        {new Date(user.subscription_end_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mental Health Metrics */}
            <div className="bg-white rounded-xl border border-border p-6 mb-8">
                <h3 className="font-semibold text-foreground mb-4">Mental Health Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-muted mb-2">Mental Health</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted-bg rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${(user.avg_mental_health / 10) * 100}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-foreground">
                                {user.avg_mental_health.toFixed(1)}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-muted mb-2">Happiness</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted-bg rounded-full h-2">
                                <div
                                    className="bg-yellow-500 h-2 rounded-full"
                                    style={{ width: `${(user.avg_happiness / 10) * 100}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-foreground">
                                {user.avg_happiness.toFixed(1)}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-muted mb-2">Stress Level</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted-bg rounded-full h-2">
                                <div
                                    className="bg-orange-500 h-2 rounded-full"
                                    style={{ width: `${(user.avg_stress / 10) * 100}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-foreground">
                                {user.avg_stress.toFixed(1)}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-muted mb-2">Burnout Risk</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted-bg rounded-full h-2">
                                <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{ width: `${(user.avg_burnout / 10) * 100}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-foreground">
                                {user.avg_burnout.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Recent Transactions</h3>
                {user.recent_transactions.length === 0 ? (
                    <p className="text-sm text-muted text-center py-8">No transactions yet</p>
                ) : (
                    <div className="space-y-3">
                        {user.recent_transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between p-3 bg-muted-bg/30 rounded-lg"
                            >
                                <div>
                                    <p className="text-sm font-medium text-foreground capitalize">
                                        {transaction.type.replace("_", " ")}
                                    </p>
                                    <p className="text-xs text-muted">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                    ${transaction.amount.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
