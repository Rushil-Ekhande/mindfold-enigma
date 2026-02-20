// ============================================================================
// API: Admin Therapists — Fetch all therapists with profile info
// ============================================================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/therapists — Fetch all therapist profiles (admin only).
 */
export async function GET() {
    try {
        // Check if service role key is configured
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
            return NextResponse.json(
                { error: "Admin access not configured. Please set SUPABASE_SERVICE_ROLE_KEY in .env" },
                { status: 500 }
            );
        }

        const supabase = createAdminClient();

        // Fetch therapist profiles with their associated profile data
        const { data: therapistProfiles, error: therapistError } = await supabase
            .from("therapist_profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (therapistError) {
            console.error("Supabase error:", therapistError);
            return NextResponse.json({ error: therapistError.message }, { status: 500 });
        }

        if (!therapistProfiles || therapistProfiles.length === 0) {
            return NextResponse.json([]);
        }

        // Fetch profile data for each therapist
        const therapistIds = therapistProfiles.map((t) => t.id);
        const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", therapistIds);

        if (profileError) {
            console.error("Profile fetch error:", profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // Merge the data
        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
        const result = therapistProfiles.map((therapist) => ({
            ...therapist,
            profiles: profileMap.get(therapist.id) || null,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error("Unexpected error in GET /api/admin/therapists:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
<<<<<<< HEAD

    // Generate signed URLs for private documents
    const dataWithSignedUrls = await Promise.all(
        (data || []).map(async (therapist) => {
            let signedGovIdUrl = therapist.government_id_url;
            let signedDegreeUrl = therapist.degree_certificate_url;

            if (therapist.government_id_url) {
                const { data: signedData } = await supabase.storage
                    .from("therapist-documents")
                    .createSignedUrl(therapist.government_id_url, 3600); // 1 hour expiry
                if (signedData?.signedUrl) signedGovIdUrl = signedData.signedUrl;
            }

            if (therapist.degree_certificate_url) {
                const { data: signedData } = await supabase.storage
                    .from("therapist-documents")
                    .createSignedUrl(therapist.degree_certificate_url, 3600);
                if (signedData?.signedUrl) signedDegreeUrl = signedData.signedUrl;
            }

            return {
                ...therapist,
                government_id_url: signedGovIdUrl,
                degree_certificate_url: signedDegreeUrl,
            };
        })
    );

    return NextResponse.json(dataWithSignedUrls);
=======
>>>>>>> a9436c13c7dd9ccf85c1453a44b829e28f5bf969
}
