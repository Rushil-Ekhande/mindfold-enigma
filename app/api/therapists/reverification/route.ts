// ============================================================================
// API: Therapist Re-verification — Document Re-submission
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/therapists/reverification
 * Re-submit documents after rejection
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify user is a therapist
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "therapist") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get current therapist status
        const { data: therapistProfile } = await supabase
            .from("therapist_profiles")
            .select("verification_status, can_resubmit, rejection_count, government_id_url, degree_certificate_url")
            .eq("id", user.id)
            .single();

        if (!therapistProfile) {
            return NextResponse.json(
                { error: "Therapist profile not found" },
                { status: 404 }
            );
        }

        // Check if therapist is rejected
        if (therapistProfile.verification_status !== "rejected") {
            return NextResponse.json(
                { error: "Re-verification only available for rejected applications" },
                { status: 400 }
            );
        }

        // Check if can resubmit
        if (!therapistProfile.can_resubmit) {
            return NextResponse.json(
                { error: "Maximum rejection limit reached. Cannot resubmit." },
                { status: 403 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const governmentIdFile = formData.get("government_id") as File | null;
        const degreeCertFile = formData.get("degree_certificate") as File | null;

        if (!governmentIdFile || !degreeCertFile) {
            return NextResponse.json(
                { error: "Both documents are required" },
                { status: 400 }
            );
        }

        // Validate file types
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
        if (
            !allowedTypes.includes(governmentIdFile.type) ||
            !allowedTypes.includes(degreeCertFile.type)
        ) {
            return NextResponse.json(
                { error: "Invalid file type. Only PDF, JPG, and PNG are allowed." },
                { status: 400 }
            );
        }

        // Validate file sizes (max 5MB each)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (governmentIdFile.size > maxSize || degreeCertFile.size > maxSize) {
            return NextResponse.json(
                { error: "File size too large. Maximum 5MB per file." },
                { status: 400 }
            );
        }

        // Delete old documents from storage if they exist
        const oldDocUrls = [
            therapistProfile.government_id_url,
            therapistProfile.degree_certificate_url,
        ].filter(Boolean);

        for (const url of oldDocUrls) {
            if (url) {
                try {
                    // Extract file path from URL
                    const urlObj = new URL(url);
                    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
                    if (pathMatch) {
                        const filePath = pathMatch[1];
                        await supabase.storage.from("therapist-documents").remove([filePath]);
                        console.log("Deleted old document:", filePath);
                    }
                } catch (err) {
                    console.error("Error deleting old document:", err);
                    // Continue even if deletion fails
                }
            }
        }

        // Upload new documents with original filenames preserved
        const timestamp = Date.now();
        // Sanitize filename to remove special characters but keep the original name
        const sanitizeFilename = (filename: string) => {
            return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        };
        
        const govIdOriginalName = sanitizeFilename(governmentIdFile.name);
        const degreeOriginalName = sanitizeFilename(degreeCertFile.name);
        
        // Store paths in format: {user_id}/government_id_{original_filename}
        const govIdPath = `${user.id}/government_id_${govIdOriginalName}`;
        const degreePath = `${user.id}/degree_certificate_${degreeOriginalName}`;

        const govIdBuffer = await governmentIdFile.arrayBuffer();
        const degreeBuffer = await degreeCertFile.arrayBuffer();

        const { error: govIdError } = await supabase.storage
            .from("therapist-documents")
            .upload(govIdPath, govIdBuffer, {
                contentType: governmentIdFile.type,
                upsert: true, // Allow overwriting if file exists
            });

        if (govIdError) {
            console.error("Government ID upload error:", govIdError);
            return NextResponse.json(
                { error: "Failed to upload government ID" },
                { status: 500 }
            );
        }

        const { error: degreeError } = await supabase.storage
            .from("therapist-documents")
            .upload(degreePath, degreeBuffer, {
                contentType: degreeCertFile.type,
                upsert: true, // Allow overwriting if file exists
            });

        if (degreeError) {
            console.error("Degree certificate upload error:", degreeError);
            // Clean up government ID if degree upload fails
            await supabase.storage.from("therapist-documents").remove([govIdPath]);
            return NextResponse.json(
                { error: "Failed to upload degree certificate" },
                { status: 500 }
            );
        }

        // Store the file PATHS (not URLs) in database
        // We'll generate signed URLs on-demand when viewing

        // Update therapist profile with file paths (not signed URLs)
        const { error: updateError } = await supabase
            .from("therapist_profiles")
            .update({
                government_id_url: govIdPath, // Store path, not URL
                degree_certificate_url: degreePath, // Store path, not URL
                verification_status: "pending",
                resubmission_requested: true,
                rejection_reason: null, // Clear rejection reason on resubmission
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("Profile update error:", updateError);
            return NextResponse.json(
                { error: "Failed to update profile" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Documents submitted successfully. Awaiting admin review.",
        });
    } catch (error) {
        console.error("Error in reverification:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
