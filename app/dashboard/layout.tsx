// ============================================================================
// User Dashboard Layout
// Provides sidebar navigation for all user dashboard pages
// ============================================================================

import {
    LayoutDashboard,
    BookOpen,
    MessageCircle,
    Users,
    CreditCard,
    Settings,
} from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

const userLinks = [
    {
        label: "Overview",
        href: "/dashboard/overview",
        icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
        label: "Journal",
        href: "/dashboard/journal",
        icon: <BookOpen className="h-4 w-4" />,
    },
    {
        label: "Ask Journal",
        href: "/dashboard/ask-journal",
        icon: <MessageCircle className="h-4 w-4" />,
    },
    {
        label: "My Therapist",
        href: "/dashboard/therapist",
        icon: <Users className="h-4 w-4" />,
    },
    {
        label: "Billing",
        href: "/dashboard/billing",
        icon: <CreditCard className="h-4 w-4" />,
    },
    {
        label: "Settings",
        href: "/dashboard/settings",
        icon: <Settings className="h-4 w-4" />,
    },
];

export default function UserDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted-bg/30">
            <DashboardSidebar links={userLinks} roleLabel="User Dashboard" />
            <main className="ml-64 p-8">{children}</main>
        </div>
    );
}
