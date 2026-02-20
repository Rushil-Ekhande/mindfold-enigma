// ============================================================================
// Admin Dashboard — All Transactions Page
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { DollarSign, Filter, Download } from "lucide-react";

interface Transaction {
    id: string;
    user_name: string;
    user_email: string;
    amount: number;
    currency: string;
    transaction_type: string;
    status: string;
    description: string;
    created_at: string;
}

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        fetchTransactions();
    }, []);

    async function fetchTransactions() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/transactions");
            const data = await res.json();
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        }
        setLoading(false);
    }

    const filteredTransactions = transactions.filter((t) => {
        if (filterType !== "all" && t.transaction_type !== filterType) return false;
        if (filterStatus !== "all" && t.status !== filterStatus) return false;
        return true;
    });

    const totalRevenue = filteredTransactions
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

    const subscriptionRevenue = filteredTransactions
        .filter((t) => t.transaction_type === "subscription" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

    const therapistPayments = filteredTransactions
        .filter((t) => t.transaction_type === "therapist_payment" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">All Transactions</h1>
                    <p className="text-muted mt-1">View and manage platform transactions</p>
                </div>
                <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
            </div>

            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm text-muted">Total Revenue</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        ${totalRevenue.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-muted">Subscription Revenue</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        ${subscriptionRevenue.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-sm text-muted">Therapist Payments</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        ${therapistPayments.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
                <div className="flex items-center gap-4">
                    <Filter className="h-5 w-5 text-muted" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="all">All Types</option>
                        <option value="subscription">Subscriptions</option>
                        <option value="therapist_payment">Therapist Payments</option>
                        <option value="refund">Refunds</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                    <span className="text-sm text-muted ml-auto">
                        Showing {filteredTransactions.length} transactions
                    </span>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted-bg/50">
                            <tr>
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
                                    Status
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                    Description
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((transaction) => (
                                <tr
                                    key={transaction.id}
                                    className="border-t border-border hover:bg-muted-bg/30"
                                >
                                    <td className="py-3 px-4">
                                        <div>
                                            <p className="font-medium text-foreground text-sm">
                                                {transaction.user_name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {transaction.user_email}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                transaction.transaction_type === "subscription"
                                                    ? "bg-blue-50 text-blue-600"
                                                    : transaction.transaction_type ===
                                                      "therapist_payment"
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : "bg-amber-50 text-amber-600"
                                            }`}
                                        >
                                            {transaction.transaction_type.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm font-semibold text-foreground">
                                            ${transaction.amount.toFixed(2)}
                                        </span>
                                        <span className="text-xs text-muted ml-1">
                                            {transaction.currency}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                transaction.status === "completed"
                                                    ? "bg-success/10 text-success"
                                                    : transaction.status === "pending"
                                                    ? "bg-amber-50 text-amber-600"
                                                    : transaction.status === "failed"
                                                    ? "bg-danger/10 text-danger"
                                                    : "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {transaction.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm text-muted">
                                            {transaction.description || "—"}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm text-muted">
                                            {new Date(transaction.created_at).toLocaleString()}
                                        </span>
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
