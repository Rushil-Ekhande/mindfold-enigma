// ============================================================================
// Supabase Middleware Helper
// Refreshes auth tokens on every request so sessions stay alive
// ============================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session and writes updated cookies.
 * Called from the root middleware on every matched request.
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // Forward cookies onto the request so server components can read them
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh the session — do NOT remove this line
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // ---------- Route Protection ----------

    const pathname = request.nextUrl.pathname;

    // Public routes that don't require auth
    const publicRoutes = [
        "/",
        "/auth/login",
        "/auth/signup",
        "/auth/therapist-register",
    ];
    const isPublicRoute =
        publicRoutes.includes(pathname) || pathname.startsWith("/api/");

    // If not logged in and trying to access a protected route → redirect to login
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
    }

    // If logged in, fetch role from profile and enforce role-based routing
    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const role = profile?.role;

        // Redirect logged-in users away from auth pages
        if (pathname.startsWith("/auth/")) {
            const url = request.nextUrl.clone();
            if (role === "therapist") url.pathname = "/therapist/overview";
            else if (role === "admin") url.pathname = "/admin/overview";
            else url.pathname = "/dashboard/overview";
            return NextResponse.redirect(url);
        }

        // Prevent users from accessing other role dashboards
        if (pathname.startsWith("/dashboard") && role !== "user") {
            const url = request.nextUrl.clone();
            url.pathname =
                role === "therapist" ? "/therapist/overview" : "/admin/overview";
            return NextResponse.redirect(url);
        }

        if (pathname.startsWith("/therapist") && role !== "therapist") {
            const url = request.nextUrl.clone();
            url.pathname =
                role === "admin" ? "/admin/overview" : "/dashboard/overview";
            return NextResponse.redirect(url);
        }

        if (pathname.startsWith("/admin") && role !== "admin") {
            const url = request.nextUrl.clone();
            url.pathname =
                role === "therapist" ? "/therapist/overview" : "/dashboard/overview";
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
