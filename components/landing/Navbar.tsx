// ============================================================================
// Landing Page — Navbar Component (Dynamic)
// ============================================================================

"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { useEffect, useState } from "react";

interface NavLink {
  label: string;
  href: string;
}

interface NavbarContent {
  brandName?: string;
  links?: NavLink[];
  loginText?: string;
  signupText?: string;
}

const defaultLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Reviews", href: "#reviews" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [content, setContent] = useState<NavbarContent>({
    brandName: "Mindfold",
    links: defaultLinks,
    loginText: "Log In",
    signupText: "Get Started",
  });

  useEffect(() => {
    fetch("/api/landing")
      .then((res) => res.json())
      .then((sections) => {
        if (Array.isArray(sections)) {
          const navbar = sections.find(
            (s: { section_name: string }) => s.section_name === "navbar",
          );
          if (navbar?.content) {
            setContent((prev) => ({ ...prev, ...navbar.content }));
          }
        }
      })
      .catch((err) => console.error("Failed to load navbar content:", err));
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full pt-4 px-4 pointer-events-none">
      <nav className="bg-white/95 backdrop-blur-lg border border-border shadow-sm rounded-full pointer-events-auto px-6 py-3 w-full max-w-5xl flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-[#0a1128] text-white p-2 rounded-xl flex items-center justify-center">
            <Brain className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-foreground leading-tight">
              {content.brandName}
            </span>
            <span className="text-[10px] text-muted font-medium leading-tight">
              By Teamtailor
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {content.links?.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className="text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors hidden sm:block"
          >
            {content.loginText}
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm font-semibold bg-black/5 text-[#0a1128] border border-black/10 px-5 py-2.5 rounded-full hover:bg-[#0a1128] hover:text-white transition-colors"
          >
            {content.signupText || "Book demo"}
          </Link>
        </div>
      </nav>
    </div>
  );
}
