// ============================================================================
// OpenAI Helper
// Wraps OpenAI SDK for journal analysis and chat features
// ============================================================================

import OpenAI from "openai";

let _ai: OpenAI | null = null;

function getAI(): OpenAI {
    if (!_ai) {
        _ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    }
    return _ai;
}

/**
 * Analyzes a journal entry and returns mental health metrics + AI reflection.
 */
export async function analyzeJournalEntry({
    entryDate,
    currentEntry,
    contextSection = ""
}: {
    entryDate: string;
    currentEntry: string;
    contextSection?: string;
}): Promise<{
    mental_health: number;
    stress: number;
    happiness: number;
    accountability: number;
    burnout_risk: number;
    mood: string;
    emotional_summary: string;
}> {
    const prompt = `You are an expert at analyzing journal entries for mental health metrics. Your job is to read the entry and assign accurate, intuitive scores for each metric, following these rules:

SCORING RULES (0-100):
- mental_health: Higher means better overall well-being and resilience. Low if the entry is negative, hopeless, or overwhelmed.
- stress: Higher means more stress, anxiety, or pressure. If the entry describes a hectic, overwhelming, or anxious day, score stress HIGH (70-100). If calm or relaxed, score LOW (0-30).
- happiness: Higher means more joy, gratitude, or contentment. If the entry is positive ("today was great"), score HIGH (70-100). If negative, score LOW (0-30).
4. accountability: Higher means the person kept promises to themselves, followed through, or showed self-discipline. Lower if they mention procrastination, avoidance, or regret.
5. burnout_risk: Higher means the person is at risk of exhaustion, feeling overwhelmed, or describes ongoing stress. If the entry is about being overworked, tired, or unable to rest, score HIGH (70-100). If rested and balanced, score LOW (0-30).
6. mood: Provide a single word (e.g. Happy, Anxious, Calm, Neutral, Sad, Excited) that best captures the emotional state of the entry.

IMPORTANT:
- Do NOT invert the stress or burnout_risk scores. High = more stress/burnout, low = less.
- Use the full range (0-100) and be responsive to the entry's emotional tone.
- If the entry is neutral or unclear, use mid-range scores (40-60).

ENTRY DATE: ${entryDate}

JOURNAL ENTRY:
${currentEntry}
${contextSection}

Please provide:
1. emotional_summary: A warm, empathetic paragraph (300-500 characters) validating their feelings, reflecting on their experience, and gently noting any patterns. Do NOT give advice or clinical language.
2. The following metrics as a JSON object:
{
    "mental_health": number,
    "stress": number,
    "happiness": number,
    "accountability": number,
    "burnout_risk": number,
    "mood": "string",
    "emotional_summary": "string"
}

Return ONLY valid JSON with these exact keys.`;

    const response = await getAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
    });

    try {
        const text = response.choices[0]?.message?.content ?? "";
        return JSON.parse(text);
    } catch {
        // Fallback scores if parsing fails
        return {
            mental_health: 50,
            stress: 50,
            happiness: 50,
            accountability: 50,
            burnout_risk: 50,
            mood: "Neutral",
            emotional_summary:
                "Thank you for sharing your thoughts today. I notice your willingness to reflect, and that takes real courage. Keep journaling to build a clearer picture of your journey."
        };
    }
}

/**
 * Generates an answer to a user's question based on their journal entries.
 * @param question - The user's question
 * @param entries - Journal entries to analyze
 * @param mode - quick_reflect uses recent entries, deep_reflect uses all
 */
export async function askJournal(
    question: string,
    entries: { entry_date: string; content: string }[],
    mode: "quick_reflect" | "deep_reflect"
): Promise<string> {
    const entriesText = entries
        .map((e) => `[${e.entry_date}]: ${e.content}`)
        .join("\n\n");

    const entryCount = entries.length;
    const contextNote =
        mode === "quick_reflect"
            ? `You are analyzing the user's recent journal entries (${entryCount} ${entryCount === 1 ? "entry" : "entries"}). Give a focused, concise answer based on what's available. Keep your response between 500-800 characters.`
            : `You are performing a deep analysis of the user's journal history (${entryCount} ${entryCount === 1 ? "entry" : "entries"}). Give a thorough, detailed answer with patterns and insights based on what's available. Keep your response between 1000-1500 characters.`;

    const systemPrompt = `${contextNote}

You are an empathetic AI wellness companion. The user is asking a reflective question about their life based on their journal entries. Provide a personalized, thoughtful, and supportive answer.

${entryCount < 5 ? "NOTE: The user has a limited number of entries, so base your response on what IS available rather than what's missing. Be encouraging about continuing to journal." : ""}`;

    const userContent = `User's journal entries:\n${entriesText}\n\nUser's question: "${question}"\n\nProvide a detailed, personalized answer that references specific patterns or entries when relevant. Be empathetic and constructive.`;

    const response = await getAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
        ],
        temperature: 0.7,
    });

    return response.choices[0]?.message?.content ?? "I wasn't able to generate a response. Please try again.";
}

