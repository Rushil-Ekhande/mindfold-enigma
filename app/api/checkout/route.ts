import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { planId, billingCycle } = await request.json();

        if (!planId || !billingCycle) {
            return NextResponse.json(
                { error: "Missing required fields: planId, billingCycle" },
                { status: 400 }
            );
        }

        // Get plan details from database
        const { data: plan, error: planError } = await supabase
            .from("subscription_plans")
            .select("*")
            .eq("plan_name", planId)
            .eq("is_active", true)
            .single();

        if (planError || !plan) {
            return NextResponse.json(
                { error: "Plan not found" },
                { status: 404 }
            );
        }

        // Get user profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", user.id)
            .single();

        if (!profile?.email) {
            return NextResponse.json(
                { error: "User profile email not found" },
                { status: 400 }
            );
        }

        // Create checkout session with Dodo Payments using the correct API
        const apiUrl = process.env.DODO_PAYMENTS_ENVIRONMENT === 'test_mode'
            ? 'https://test.dodopayments.com'
            : 'https://live.dodopayments.com';

        // DEBUG LOGGING
        console.log('Dodo Payments API Debug:', {
            apiUrl,
            apiKey: process.env.DODO_PAYMENTS_API_KEY,
            env: process.env.DODO_PAYMENTS_ENVIRONMENT,
            returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
        });

        const checkoutResponse = await fetch(`${apiUrl}/checkouts`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                product_cart: [
                    {
                        product_id: plan.dodo_product_id,
                        quantity: 1,
                    }
                ],
                customer: {
                    email: profile.email,
                    name: profile.full_name || profile.email.split('@')[0],
                },
                return_url: `${process.env.DODO_PAYMENTS_RETURN_URL || 'http://localhost:3000/dashboard'}/billing?session=success`,
            }),
        });

        // Log full response for debugging
        const responseText = await checkoutResponse.text();
        let checkoutData: { checkout_url?: string; session_id?: string } = {};
        try {
            checkoutData = JSON.parse(responseText);
        } catch {
            console.error('Failed to parse Dodo Payments response:', responseText);
        }

        if (!checkoutResponse.ok) {
            console.error("Dodo Payments API error:", {
                status: checkoutResponse.status,
                body: responseText,
            });
            return NextResponse.json(
                { error: "Failed to create checkout session", details: responseText },
                { status: 500 }
            );
        }

        return NextResponse.json({
            checkout_url: checkoutData.checkout_url,
            session_id: checkoutData.session_id,
            raw: responseText,
        });

    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
