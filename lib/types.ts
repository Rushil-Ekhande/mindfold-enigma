// Journal Entry Type
export interface JournalEntry {
    id: string; // uuid
    user_id: string; // uuid
    entry_date: string; // date
    content: string;
    ai_reflection?: string;
    mental_health_score?: number;
    happiness_score?: number;
    accountability_score?: number;
    stress_score?: number;
    burnout_risk_score?: number;
    visible_to_therapist?: boolean;
    created_at?: string;
    updated_at?: string;
    mood?: string;
}
// Journal Chat Types
export type ChatMode = "quick_reflect" | "deep_reflect";

export interface JournalChatConversation {
    id: string; // uuid
    user_id: string; // uuid
    title?: string; // nullable, default 'New Conversation'
    chat_mode: ChatMode;
    created_at?: string; // nullable, timestamp
    updated_at?: string; // nullable, timestamp
}

export interface JournalChatMessage {
    id: string; // uuid
    conversation_id: string; // uuid
    role: "user" | "assistant";
    content: string;
    created_at?: string; // nullable, timestamp
}
export type SubscriptionPlan = 'basic' | 'intermediate' | 'advanced';

export interface SubscriptionPlanDetails {
    id: string;
    plan_name: SubscriptionPlan;
    display_name: string;
    price_monthly: number;
    price_yearly?: number;
    quick_reflect_limit: number;
    deep_reflect_limit: number;
    therapist_sessions_per_week: number;
    description: string;
    features: string[];
    is_active: boolean;
    dodo_product_id?: string;
}

export interface UserSubscription {
    id: string;
    user_id: string;
    plan_name: SubscriptionPlan;
    status: 'active' | 'cancelled' | 'expired' | 'on_hold';
    dodo_subscription_id?: string;
    dodo_customer_id?: string;
    dodo_payment_id?: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    cancelled_at?: string;
    amount: number;
    currency: string;
    billing_cycle: 'monthly' | 'yearly';
    created_at: string;
    updated_at: string;
}

export interface UsageTracking {
    id: string;
    user_id: string;
    subscription_id: string;
    period_start: string;
    period_end: string;
    quick_reflect_used: number;
    deep_reflect_used: number;
    therapist_sessions_used: number;
    created_at: string;
    updated_at: string;
}

export interface PaymentHistory {
    id: string;
    user_id: string;
    subscription_id?: string;
    dodo_payment_id: string;
    dodo_customer_id?: string;
    amount: number;
    currency: string;
    status: 'succeeded' | 'failed' | 'processing' | 'cancelled';
    payment_method?: string;
    description?: string;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionWithUsage {
    subscription: UserSubscription;
    plan: SubscriptionPlanDetails;
    usage: UsageTracking;
    limits: {
        quick_reflect: { used: number; limit: number; remaining: number };
        deep_reflect: { used: number; limit: number; remaining: number };
        therapist_sessions: { used: number; limit: number; remaining: number };
    };
}
