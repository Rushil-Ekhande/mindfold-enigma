// ============================================================================
// Therapist Dashboard Layout
// Provides sidebar navigation for all therapist pages
// ============================================================================

import { LayoutDashboard, Users, Settings } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

const therapistLinks = [
  {
    label: "Overview",
    href: "/therapist/overview",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Patients",
    href: "/therapist/patients",
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "Settings",
    href: "/therapist/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

export default function TherapistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted-bg/30">
      <DashboardSidebar
        links={therapistLinks}
        roleLabel="Therapist Dashboard"
      />
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
