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
    <nav className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4">
      <div className="flex items-center justify-between max-w-5xl w-full px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Brain className="h-7 w-7 text-black" />
          <span className="text-lg font-bold text-black">
            {content.brandName}
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          {content.links?.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className="text-sm text-black hover-underline transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-black hover-underline transition-colors"
          >
            {content.loginText}
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm font-medium bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-colors shadow-sm"
          >
            {content.signupText}
          </Link>
        </div>
      </div>
    </nav>
  );
}
