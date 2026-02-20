// ============================================================================
// Auth Server Actions
// Handles signup, login, and therapist registration
// ============================================================================

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Signs up a new user with full name, email, and password.
 * Creates a profile and user_profile row in Supabase.
 */
export async function signupAction(formData: FormData) {
    const supabase = await createClient();

    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    });

    if (authError || !authData.user) {
        return { error: authError?.message || "Signup failed. Please try again." };
    }

    // 2. Create profile row
    const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        full_name: fullName,
        email,
        role: "user",
    });

    if (profileError) {
        return { error: "Failed to create profile. Please try again." };
    }

    // 3. Create user_profile row
    await supabase.from("user_profiles").insert({
        id: authData.user.id,
        subscription_plan: "basic",
    });

    redirect("/auth/login?registered=true");
}

/**
 * Logs in an existing user with email and password.
 * Redirects to the appropriate dashboard based on role.
 */
export async function loginAction(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: "Invalid email or password." };
    }

    // Fetch user role to determine redirect
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Authentication failed." };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile) {
        return { error: "Profile not found. Please contact support or try signing up again." };
    }

    const role = profile.role;

    if (role === "therapist") redirect("/therapist/overview");
    if (role === "admin") redirect("/admin/overview");
    redirect("/dashboard/overview");
}

/**
 * Registers a new therapist with documents.
 * Creates profile + therapist_profile with pending verification.
 */
export async function therapistRegisterAction(formData: FormData) {
    const supabase = await createClient();

    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const licenseNumber = formData.get("licenseNumber") as string;
    const governmentId = formData.get("governmentId") as File;
    const degreeCertificate = formData.get("degreeCertificate") as File;

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    });

    if (authError || !authData.user) {
        return { error: authError?.message || "Registration failed." };
    }

    const userId = authData.user.id;

    // 2. Upload documents to Supabase Storage
    let governmentIdUrl = "";
    let degreeCertificateUrl = "";

    if (governmentId && governmentId.size > 0) {
        const { data } = await supabase.storage
            .from("therapist-documents")
            .upload(`${userId}/government-id-${Date.now()}`, governmentId);
        if (data) governmentIdUrl = data.path;
    }

    if (degreeCertificate && degreeCertificate.size > 0) {
        const { data } = await supabase.storage
            .from("therapist-documents")
            .upload(`${userId}/degree-cert-${Date.now()}`, degreeCertificate);
        if (data) degreeCertificateUrl = data.path;
    }

    // 3. Create profile row
    const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: fullName,
        email,
        role: "therapist",
    });

    if (profileError) {
        return { error: "Failed to create profile." };
    }

    // 4. Create therapist_profile row
    await supabase.from("therapist_profiles").insert({
        id: userId,
        display_name: fullName,
        license_number: licenseNumber,
        government_id_url: governmentIdUrl,
        degree_certificate_url: degreeCertificateUrl,
        verification_status: "pending",
    });

    redirect("/auth/login?therapist_registered=true");
}

/**
 * Signs out the current user and redirects to homepage.
 */
export async function signOutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
}
