// ============================================================================
// Landing Page — Navbar Component (Server Component)
// ============================================================================

import Link from "next/link";
import { Brain } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <Brain className="h-8 w-8 text-primary" />
                        <span className="text-xl font-bold text-foreground">Mindfold</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a
                            href="#features"
                            className="text-sm text-muted hover:text-foreground transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            className="text-sm text-muted hover:text-foreground transition-colors"
                        >
                            How It Works
                        </a>
                        <a
                            href="#reviews"
                            className="text-sm text-muted hover:text-foreground transition-colors"
                        >
                            Reviews
                        </a>
                        <a
                            href="#pricing"
                            className="text-sm text-muted hover:text-foreground transition-colors"
                        >
                            Pricing
                        </a>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/auth/login"
                            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                        >
                            Log In
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
