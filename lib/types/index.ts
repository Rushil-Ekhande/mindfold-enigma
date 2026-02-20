// ============================================================================
// MINDFOLD - TypeScript Type Definitions
// Maps to Supabase database schema
// ============================================================================

// --------------------------------------------------------------------------
// Enum Types
// --------------------------------------------------------------------------

export type UserRole = "user" | "therapist" | "admin";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type SessionStatus =
    | "requested"
    | "scheduled"
    | "completed"
    | "cancelled"
    | "postponed";
export type SubscriptionPlan = "basic" | "intermediate" | "advanced";
export type ChatMode = "quick_reflect" | "deep_reflect";
export type TransactionType = "subscription" | "therapist_payment" | "refund";
export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

// --------------------------------------------------------------------------
// Database Row Types
// --------------------------------------------------------------------------

/** Base user profile — extends Supabase auth.users */
export interface Profile {
    id: string;
    full_name: string;
    role: UserRole;
    email: string;
    created_at: string;
    updated_at: string;
}

/** Additional data for regular users */
export interface UserProfile {
    id: string;
    subscription_plan: SubscriptionPlan;
    subscription_start_date: string | null;
    subscription_end_date: string | null;
    current_therapist_id: string | null;
    allow_therapist_access: boolean;
    created_at: string;
    updated_at: string;
}

/** Additional data for therapists */
export interface TherapistProfile {
    id: string;
    display_name: string | null;
    description: string | null;
    photo_url: string | null;
    qualifications: string[];
    verification_status: VerificationStatus;
    government_id_url: string | null;
    license_number: string | null;
    degree_certificate_url: string | null;
    rating: number;
    total_patients: number;
    total_earnings: number;
    created_at: string;
    updated_at: string;
}

/** Service plans offered by therapists */
export interface TherapistService {
    id: string;
    therapist_id: string;
    sessions_per_week: number;
    price_per_session: number;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Patient testimonials for therapists */
export interface TherapistTestimonial {
    id: string;
    therapist_id: string;
    testimonial_text: string;
    author_name: string;
    rating: number;
    created_at: string;
}

/** Daily journal entry with mental health metrics */
export interface JournalEntry {
    id: string;
    user_id: string;
    entry_date: string;
    content: string;
    ai_reflection: string | null;
    mental_health_score: number | null;
    happiness_score: number | null;
    accountability_score: number | null;
    stress_score: number | null;
    burnout_risk_score: number | null;
    visible_to_therapist: boolean;
    created_at: string;
    updated_at: string;
}

/** Chat conversation for "Ask Journal" feature */
export interface JournalChatConversation {
    id: string;
    user_id: string;
    title: string;
    chat_mode: ChatMode;
    created_at: string;
    updated_at: string;
}

/** Individual message in a chat conversation */
export interface JournalChatMessage {
    id: string;
    conversation_id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

/** Therapist–patient relationship */
export interface TherapistPatient {
    id: string;
    therapist_id: string;
    user_id: string;
    service_id: string;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    created_at: string;
}

/** Session request between user and therapist */
export interface SessionRequest {
    id: string;
    relationship_id: string;
    user_id: string;
    therapist_id: string;
    status: SessionStatus;
    requested_date: string;
    scheduled_date: string | null;
    meeting_link: string | null;
    user_notes: string | null;
    created_at: string;
    updated_at: string;
}

/** Therapist notes from a session */
export interface SessionNote {
    id: string;
    session_id: string;
    therapist_id: string;
    user_id: string;
    summary: string | null;
    doctors_notes: string | null;
    prescription: string | null;
    exercises: string | null;
    created_at: string;
    updated_at: string;
}

/** Payment transaction */
export interface BillingTransaction {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    description: string | null;
    transaction_type: TransactionType;
    payment_provider_id: string | null;
    status: TransactionStatus;
    created_at: string;
}

/** Admin-managed landing page section */
export interface LandingPageSection {
    id: string;
    section_name: string;
    content: Record<string, unknown>;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
}

// --------------------------------------------------------------------------
// Joined / Composite Types (used in UI)
// --------------------------------------------------------------------------

/** Therapist card displayed to users during search */
export interface TherapistCardData extends TherapistProfile {
    full_name: string;
    email: string;
    services: TherapistService[];
    testimonials: TherapistTestimonial[];
}

/** Patient card displayed to therapists */
export interface PatientCardData {
    relationship: TherapistPatient;
    profile: Profile;
    user_profile: UserProfile;
    pending_sessions: number;
}

/** Mental metrics object for convenience */
export interface MentalMetrics {
    mental_health: number;
    happiness: number;
    accountability: number;
    stress: number;
    burnout_risk: number;
}

/** Pricing plan for the billing page */
export interface PricingPlan {
    name: string;
    price: number;
    plan: SubscriptionPlan;
    features: string[];
    highlighted?: boolean;
}
