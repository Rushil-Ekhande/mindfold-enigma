// ============================================================================
// Google Gemini AI Helper
// Wraps Google AI SDK for journal analysis and chat features
// ============================================================================

import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
    if (!_ai) {
        _ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
    }
    return _ai;
}

/**
 * Analyzes a journal entry and returns mental health metrics + AI reflection.
 */
export async function analyzeJournalEntry(content: string): Promise<{
    mental_health_score: number;
    happiness_score: number;
    accountability_score: number;
    stress_score: number;
    burnout_risk_score: number;
    ai_reflection: string;
}> {
    const response = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a mental health analysis AI. Analyze the following journal entry and provide:
1. Mental health metrics (each scored 0-100):
   - mental_health_score: Overall mental wellness (100 = excellent mental health, 0 = poor mental health)
   - happiness_score: Level of happiness/positivity (100 = very happy, 0 = very sad)
   - accountability_score: Self-responsibility and follow-through (100 = high accountability, 0 = low accountability)
   - stress_score: Stress level (100 = NO STRESS/very calm, 0 = EXTREME STRESS)
   - burnout_risk_score: Burnout risk (100 = NO BURNOUT RISK/very energized, 0 = SEVERE BURNOUT RISK)

IMPORTANT: For stress_score and burnout_risk_score, higher is better. If someone says "it was a good day, I liked it", they should get HIGH scores (80-95) for stress_score and burnout_risk_score.

2. A brief empathetic AI reflection (2-3 sentences summarizing insights)

Return ONLY valid JSON with these exact keys:
{
  "mental_health_score": number,
  "happiness_score": number,
  "accountability_score": number,
  "stress_score": number,
  "burnout_risk_score": number,
  "ai_reflection": "string"
}

Journal entry:
"${content}"`,
    });

    try {
        const text = response.text ?? "";
        // Extract JSON from the response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in AI response");
        return JSON.parse(jsonMatch[0]);
    } catch {
        // Fallback scores if parsing fails
        return {
            mental_health_score: 50,
            happiness_score: 50,
            accountability_score: 50,
            stress_score: 50,
            burnout_risk_score: 50,
            ai_reflection:
                "Thank you for sharing your thoughts today. Keep journaling to build a clearer picture of your mental wellness journey.",
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
            ? `You are analyzing the user's recent journal entries (${entryCount} ${entryCount === 1 ? "entry" : "entries"}). Give a focused, concise answer based on what's available.`
            : `You are performing a deep analysis of the user's journal history (${entryCount} ${entryCount === 1 ? "entry" : "entries"}). Give a thorough, detailed answer with patterns and insights based on what's available.`;

    const response = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${contextNote}

You are an empathetic AI wellness companion. The user is asking a reflective question about their life based on their journal entries. Provide a personalized, thoughtful, and supportive answer.

${entryCount < 5 ? "NOTE: The user has a limited number of entries, so base your response on what IS available rather than what's missing. Be encouraging about continuing to journal." : ""}

User's journal entries:
${entriesText}

User's question: "${question}"

Provide a detailed, personalized answer that references specific patterns or entries when relevant. Be empathetic and constructive.`,
    });

    return response.text ?? "I wasn't able to generate a response. Please try again.";
}
