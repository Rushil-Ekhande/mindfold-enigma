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
            ? `You have ${entryCount} recent journal ${entryCount === 1 ? "entry" : "entries"} to work with. Your response should feel conversational and grounded—about 500-800 characters. Think like you're responding to someone you know and care about.`
            : `You have ${entryCount} journal ${entryCount === 1 ? "entry" : "entries"} spanning their history. Take time to notice patterns, themes, and growth. Your response should be thorough but warm—about 1000-1500 characters. Speak like a trusted therapist who's been listening closely.`;

    const systemPrompt = `${contextNote}

You are a licensed therapist with a warm, human approach. You've been working with this person for a while, and you genuinely care about their wellbeing. Here's how you respond:

THERAPEUTIC STYLE:
- Use "I notice..." or "It sounds like..." instead of clinical jargon
- Reflect back what you hear without judgment
- Ask gentle, curious questions (1-2 max) that invite them to explore further
- Acknowledge emotions directly: "That must have felt overwhelming" or "I can hear the frustration in this"
- Normalize struggles: "Many people experience..." or "It's completely understandable that..."
- Celebrate small wins and efforts authentically
- Use their own words and language when reflecting back
- Be conversational—use contractions, vary sentence length, sound human
- If you see concerning patterns (isolation, negative self-talk), gently name them with compassion
- End with validation, encouragement, or a gentle reflection—not homework or commands

AVOID:
- Clinical terms like "cognitive distortions" or "coping mechanisms"
- Advice-giving or "you should" statements
- Toxic positivity or minimizing their experience
- Long lists or structured formats
- Robotic or overly formal language
- Generic statements that could apply to anyone

${entryCount < 5 ? "\nNOTE: They're new to journaling. Acknowledge what they've shared so far, and gently encourage them to keep going. Build trust before diving too deep." : ""}

Remember: You're having a real conversation with a real person who trusts you. Respond like you would in your therapy office—present, attuned, and genuinely engaged.`;

    const userContent = `Here are their journal entries:\n\n${entriesText}\n\nThey're asking: "${question}"\n\nRespond as their therapist—use what you've learned about them from these entries. Be specific, personal, and human. Reference actual moments or patterns you notice. Make them feel heard.`;

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

