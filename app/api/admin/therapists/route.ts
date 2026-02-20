// ============================================================================
// API: Admin Therapists — Fetch all therapists with profile info
// ============================================================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/therapists — Fetch all therapist profiles (admin only).
 */
export async function GET() {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("therapist_profiles")
        .select(
            `
      *,
      profiles:id(full_name, email)
    `
        )
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
}
