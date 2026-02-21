import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DODO_API_URL =
    process.env.DODO_PAYMENTS_ENVIRONMENT === "test_mode"
        ? "https://test.dodopayments.com"
        : "https://live.dodopayments.com";

const BASE_RETURN_URL =
    process.env.DODO_PAYMENTS_RETURN_URL ?? "http://localhost:3000/dashboard";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const planId: string | undefined = body.planId;
        const billingCycle: string | undefined = body.billingCycle;

        if (!planId || !billingCycle) {
            return NextResponse.json(
                { error: "planId and billingCycle are required" },
                { status: 400 }
            );
        }

        // Fetch plan details (must have a Dodo product ID)
        const { data: plan, error: planError } = await supabase
            .from("subscription_plans")
            .select("plan_name, dodo_product_id")
            .eq("plan_name", planId)
            .eq("is_active", true)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        if (!plan.dodo_product_id) {
            return NextResponse.json(
                { error: "No Dodo product configured for this plan" },
                { status: 422 }
            );
        }

        // Fetch user email & display name
        const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", user.id)
            .single();

        if (!profile?.email) {
            return NextResponse.json(
                { error: "User email not found" },
                { status: 400 }
            );
        }

        // Build return URL — Dodo appends subscription_id, payment_id, status automatically
        const returnUrl = `${BASE_RETURN_URL}/billing?session=success`;

        // Create the checkout session
        const dodoRes = await fetch(`${DODO_API_URL}/checkouts`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                product_cart: [{ product_id: plan.dodo_product_id, quantity: 1 }],
                customer: {
                    email: profile.email,
                    name: profile.full_name ?? profile.email.split("@")[0],
                },
                return_url: returnUrl,
                // Metadata lets webhook handler know which user/plan to activate
                metadata: {
                    user_id: user.id,
                    plan_name: planId,
                    billing_cycle: billingCycle,
                },
            }),
        });

        if (!dodoRes.ok) {
            const text = await dodoRes.text();
            console.error("Dodo Payments checkout error:", dodoRes.status, text);
            return NextResponse.json(
                { error: "Failed to create checkout session" },
                { status: 502 }
            );
        }

        const data = await dodoRes.json() as { checkout_url?: string; session_id?: string };

        return NextResponse.json({ checkout_url: data.checkout_url });
    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
