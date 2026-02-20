// ============================================================================
// Shared Utility Functions
// ============================================================================

import { type ClassValue, clsx } from "clsx";

/**
 * Merges Tailwind class names, handling conflicts.
 * Lightweight alternative to tailwind-merge for simple projects.
 */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

/**
 * Formats a date string into a human-readable format.
 */
export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * Formats a date to YYYY-MM-DD for database queries.
 */
export function toDateString(date: Date): string {
    return date.toISOString().split("T")[0];
}

/**
 * Returns the month name and year for a given date.
 */
export function getMonthYear(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Gets the number of days in a month.
 */
export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Truncates text to a given length with ellipsis.
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + "...";
}

/**
 * Pricing plans configuration for the billing page.
 */
export const PRICING_PLANS = [
    {
        name: "Basic",
        price: 9.99,
        plan: "basic" as const,
        features: [
            "Daily journal entries",
            "AI reflections",
            "Mental health metrics",
            "Ask Journal (Quick Reflect)",
            "Basic analytics",
        ],
    },
    {
        name: "Intermediate",
        price: 14.99,
        plan: "intermediate" as const,
        highlighted: true,
        features: [
            "Everything in Basic",
            "Ask Journal (Deep Reflect)",
            "Advanced analytics & graphs",
            "Therapist access",
            "Session scheduling",
            "Priority AI responses",
        ],
    },
    {
        name: "Advanced",
        price: 24.99,
        plan: "advanced" as const,
        features: [
            "Everything in Intermediate",
            "Unlimited AI conversations",
            "Detailed mental health reports",
            "Priority therapist matching",
            "Session recordings & notes",
            "Family wellness sharing",
        ],
    },
];
