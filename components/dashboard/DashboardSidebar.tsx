// ============================================================================
// Dashboard Sidebar — Reusable for User, Therapist, and Admin dashboards
// ============================================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/auth/actions";

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  links: SidebarLink[];
  roleLabel: string;
}

export default function DashboardSidebar({
  links,
  roleLabel,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <Brain className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-gray-900">Mindfold</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
