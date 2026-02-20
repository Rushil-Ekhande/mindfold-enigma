// ============================================================================
// Landing Page — Footer
// ============================================================================

import Link from "next/link";
import { Brain } from "lucide-react";

export default function Footer() {
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
                        <p className="text-sm text-gray-400 leading-relaxed">
                            AI-powered mental health tracking and reflective journaling
                            platform that transforms daily thoughts into measurable wellness
                            insights.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <a href="#features" className="hover:text-white transition-colors">
                                    Features
                                </a>
                            </li>
                            <li>
                                <a href="#pricing" className="hover:text-white transition-colors">
                                    Pricing
                                </a>
                            </li>
                            <li>
                                <a href="#how-it-works" className="hover:text-white transition-colors">
                                    How It Works
                                </a>
                            </li>
                            <li>
                                <a href="#reviews" className="hover:text-white transition-colors">
                                    Reviews
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <span className="hover:text-white transition-colors cursor-pointer">
                                    About
                                </span>
                            </li>
                            <li>
                                <span className="hover:text-white transition-colors cursor-pointer">
                                    Privacy Policy
                                </span>
                            </li>
                            <li>
                                <span className="hover:text-white transition-colors cursor-pointer">
                                    Terms of Service
                                </span>
                            </li>
                            <li>
                                <span className="hover:text-white transition-colors cursor-pointer">
                                    Contact
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* For Therapists */}
                    <div>
                        <h4 className="font-semibold mb-4">For Therapists</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link
                                    href="/auth/therapist-register"
                                    className="hover:text-white transition-colors"
                                >
                                    Join as Therapist
                                </Link>
                            </li>
                            <li>
                                <span className="hover:text-white transition-colors cursor-pointer">
                                    Therapist Guidelines
                                </span>
                            </li>
                            <li>
                                <span className="hover:text-white transition-colors cursor-pointer">
                                    Support
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
                    © {new Date().getFullYear()} Mindfold. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
