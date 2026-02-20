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
        <footer className="bg-foreground text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Brain className="h-7 w-7 text-primary-light" />
                            <span className="text-lg font-bold">Mindfold</span>
                        </Link>
                        {content.brandDescription && (
                            <p className="text-sm text-gray-400 leading-relaxed">
                                {content.brandDescription}
                            </p>
                        )}
                    </div>

                    {/* Dynamic Columns */}
                    {content.columns?.map((column, idx) => (
                        <div key={idx}>
                            <h4 className="font-semibold mb-4">{column.title}</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                {column.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        {link.href.startsWith("#") || link.href === "#" ? (
                                            <a
                                                href={link.href}
                                                className="hover:text-white transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                className="hover:text-white transition-colors"
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
                <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
                    {content.copyright}
                </div>
            </div>
        </footer>
    );
}
