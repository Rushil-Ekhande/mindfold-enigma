// ============================================================================
// Admin Dashboard Layout
// Provides sidebar navigation for all admin pages
// ============================================================================

import {
    LayoutDashboard,
    ShieldCheck,
    FileEdit,
    Users,
    CreditCard,
} from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

const adminLinks = [
    {
        label: "Overview",
        href: "/admin/overview",
        icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
        label: "Users",
        href: "/admin/users",
        icon: <Users className="h-4 w-4" />,
    },
    {
        label: "Therapists",
        href: "/admin/therapists",
        icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
        label: "Transactions",
        href: "/admin/transactions",
        icon: <CreditCard className="h-4 w-4" />,
    },
    {
        label: "Landing Page",
        href: "/admin/landing",
        icon: <FileEdit className="h-4 w-4" />,
    },
];

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted-bg/30">
            <DashboardSidebar links={adminLinks} roleLabel="Admin Dashboard" />
            <main className="ml-64 p-8">{children}</main>
        </div>
    );
}
