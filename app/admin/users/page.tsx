// ============================================================================
// Admin Dashboard — All Users Page with Individual Stats
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { Search, User, Calendar, BookOpen, TrendingUp, Eye } from "lucide-react";
import Link from "next/link";

interface UserData {
    id: string;
    full_name: string;
    email: string;
    created_at: string;
    subscription_tier: string;
    total_entries: number;
    avg_mental_health: number;
    last_entry_date: string;
    total_spent: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "entries" | "spent" | "recent">("name");

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            if (!res.ok) {
                const error = await res.json();
                console.error("API error:", error);
                setUsers([]);
                return;
            }
            const data = await res.json();
            console.log("Fetched users:", data);
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setUsers([]);
        }
        setLoading(false);
    }

    const filteredUsers = users
        .filter(
            (user) =>
                user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case "entries":
                    return b.total_entries - a.total_entries;
                case "spent":
                    return b.total_spent - a.total_spent;
                case "recent":
                    return new Date(b.last_entry_date).getTime() - new Date(a.last_entry_date).getTime();
                default:
                    return a.full_name.localeCompare(b.full_name);
            }
        });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">All Users</h1>
                <p className="text-muted mt-1">View and manage platform users</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="entries">Sort by Entries</option>
                        <option value="spent">Sort by Spending</option>
                        <option value="recent">Sort by Recent Activity</option>
                    </select>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-border p-4">
                    <p className="text-sm text-muted">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{users.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-border p-4">
                    <p className="text-sm text-muted">Active This Month</p>
                    <p className="text-2xl font-bold text-foreground">
                        {users.filter((u) => {
                            const lastEntry = new Date(u.last_entry_date);
                            const monthAgo = new Date();
                            monthAgo.setMonth(monthAgo.getMonth() - 1);
                            return lastEntry > monthAgo;
                        }).length}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-border p-4">
                    <p className="text-sm text-muted">Total Entries</p>
                    <p className="text-2xl font-bold text-foreground">
                        {users.reduce((sum, u) => sum + u.total_entries, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-border p-4">
                    <p className="text-sm text-muted">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                        ${users.reduce((sum, u) => sum + u.total_spent, 0).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
                {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center">
                        <User className="h-12 w-12 text-muted/30 mx-auto mb-3" />
                        <h3 className="font-semibold text-foreground mb-1">No Users Found</h3>
                        <p className="text-sm text-muted">
                            {searchTerm
                                ? "No users match your search criteria."
                                : "There are no users in the system yet."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted-bg/50">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                        User
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                        Subscription
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                        Entries
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                        Avg Mental Health
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                        Total Spent
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                        Last Active
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-t border-border hover:bg-muted-bg/30">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {user.full_name}
                                                    </p>
                                                    <p className="text-xs text-muted">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                                {user.subscription_tier}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-muted" />
                                                <span className="text-sm text-foreground">
                                                    {user.total_entries}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-success" />
                                                <span className="text-sm text-foreground">
                                                    {user.avg_mental_health.toFixed(1)}/10
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm font-medium text-foreground">
                                                ${user.total_spent.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted" />
                                                <span className="text-sm text-muted">
                                                    {new Date(user.last_entry_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
