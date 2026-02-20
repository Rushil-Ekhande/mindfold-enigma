// ============================================================================
// User Dashboard — Settings Page (Client Component)
// Change name, password, delete entries, delete account
// ============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    User,
    Lock,
    Trash2,
    AlertTriangle,
    Loader2,
    CheckCircle,
} from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingEntries, setDeletingEntries] = useState(false);
    const [message, setMessage] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Update name
    async function updateName() {
        if (!fullName.trim()) return;
        setSaving(true);
        setMessage("");
        const res = await fetch("/api/user/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name: fullName }),
        });
        if (res.ok) {
            setMessage("Name updated successfully!");
            setFullName("");
            router.refresh(); // Refresh server state
        }
        setSaving(false);
    }

    // Update password
    async function updatePassword() {
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setMessage("Password must be at least 6 characters.");
            return;
        }
        setSaving(true);
        setMessage("");
        const res = await fetch("/api/user/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });
        if (res.ok) {
            setMessage("Password updated successfully!");
            setPassword("");
            setConfirmPassword("");
            router.refresh();
        } else {
            const data = await res.json();
            setMessage(data.error || "Failed to update password.");
        }
        setSaving(false);
    }

    // Delete all journal entries
    async function deleteAllEntries() {
        setDeletingEntries(true);
        await fetch("/api/journal", { method: "DELETE" });
        setMessage("All journal entries deleted.");
        setDeletingEntries(false);
        router.refresh();
    }

    // Delete account
    async function deleteAccount() {
        setDeleting(true);
        await fetch("/api/user/settings", { method: "DELETE" });
        router.push("/");
    }

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

            {/* Status Message */}
            {message && (
                <div className="flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-3 rounded-lg mb-6">
                    <CheckCircle className="h-4 w-4" />
                    {message}
                </div>
            )}

            {/* Change Name */}
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-foreground">Change Name</h2>
                </div>
                <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your new name"
                    className="w-full px-4 py-2.5 border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                <button
                    onClick={updateName}
                    disabled={saving || !fullName.trim()}
                    className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update Name
                </button>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Lock className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-foreground">Change Password</h2>
                </div>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full px-4 py-2.5 border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                <button
                    onClick={updatePassword}
                    disabled={saving || !password}
                    className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update Password
                </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl border-2 border-danger/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-danger" />
                    <h2 className="font-semibold text-danger">Danger Zone</h2>
                </div>

                <div className="space-y-4">
                    {/* Delete All Entries */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Delete All Journal Entries
                            </p>
                            <p className="text-xs text-muted">
                                This will permanently delete all your journal entries.
                            </p>
                        </div>
                        <button
                            onClick={deleteAllEntries}
                            disabled={deletingEntries}
                            className="bg-danger/10 text-danger px-4 py-2 rounded-lg text-sm font-medium hover:bg-danger/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {deletingEntries && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            <Trash2 className="h-4 w-4" />
                            Delete Entries
                        </button>
                    </div>

                    <hr className="border-border" />

                    {/* Delete Account */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Delete Account
                            </p>
                            <p className="text-xs text-muted">
                                Permanently delete your account and all data.
                            </p>
                        </div>
                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="bg-danger text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                            >
                                Delete Account
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={deleteAccount}
                                    disabled={deleting}
                                    className="bg-danger text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {deleting && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Confirm Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
