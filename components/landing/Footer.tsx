// ============================================================================
// Landing Page — Footer (Dynamic)
// ============================================================================

"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { useEffect, useState } from "react";

interface FooterLink {
    label: string;
    href: string;
}

interface FooterColumn {
    title: string;
    links: FooterLink[];
}

interface FooterContent {
    brandDescription?: string;
    columns?: FooterColumn[];
    copyright?: string;
}

const defaultColumns: FooterColumn[] = [
    {
        title: "Product",
        links: [
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
            { label: "How It Works", href: "#how-it-works" },
            { label: "Reviews", href: "#reviews" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About", href: "#" },
            { label: "Privacy Policy", href: "#" },
            { label: "Terms of Service", href: "#" },
            { label: "Contact", href: "#" },
        ],
    },
    {
        title: "For Therapists",
        links: [
            { label: "Join as Therapist", href: "/auth/therapist-register" },
            { label: "Therapist Guidelines", href: "#" },
            { label: "Support", href: "#" },
        ],
    },
];

export default function Footer() {
    const [content, setContent] = useState<FooterContent>({
        brandDescription:
            "AI-powered mental health tracking and reflective journaling platform that transforms daily thoughts into measurable wellness insights.",
        columns: defaultColumns,
        copyright: `© ${new Date().getFullYear()} Mindfold. All rights reserved.`,
    });

    useEffect(() => {
        fetch("/api/landing")
            .then((res) => res.json())
            .then((sections) => {
                if (Array.isArray(sections)) {
                    const footer = sections.find((s: { section_name: string }) => s.section_name === "footer");
                    if (footer?.content) {
                        setContent((prev) => ({ ...prev, ...footer.content }));
                    }
                }
            })
            .catch((err) => console.error("Failed to load footer content:", err));
    }, []);

    return (
        <footer className="bg-white text-foreground py-20 border-t border-border/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-3 mb-6">
                            <div className="bg-primary text-white p-2.5 rounded-xl flex items-center justify-center">
                                <Brain className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold leading-tight">Mindfold</span>
                                <span className="text-xs text-muted font-medium leading-tight">By Teamtailor</span>
                            </div>
                        </Link>
                        {content.brandDescription && (
                            <p className="text-sm font-medium text-muted leading-relaxed max-w-xs">
                                {content.brandDescription}
                            </p>
                        )}
                    </div>

                    {/* Dynamic Columns */}
                    {content.columns?.map((column, idx) => (
                        <div key={idx}>
                            <h4 className="font-bold mb-6">{column.title}</h4>
                            <ul className="space-y-4 text-sm font-medium text-muted">
                                {column.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        {link.href.startsWith("#") || link.href === "#" ? (
                                            <a
                                                href={link.href}
                                                className="hover:text-primary transition-colors block"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                className="hover:text-primary transition-colors block"
                                            >
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="mt-20 pt-8 border-t border-border/50 text-center font-medium text-sm text-muted">
                    {content.copyright}
                </div>
            </div>
        </footer>
    );
}
