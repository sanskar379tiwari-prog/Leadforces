import { GoogleGenerativeAI } from '@google/generative-ai';

const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function getModel(systemInstruction, generationConfig = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: {
      temperature: generationConfig.temperature ?? 0.4,
      maxOutputTokens: generationConfig.maxOutputTokens ?? 256,
    },
  });
}

async function generateText(systemInstruction, userPrompt, opts = {}) {
  const model = getModel(systemInstruction, opts);
  const result = await model.generateContent(userPrompt);
  const text = result.response.text();
  return text.trim();
}

const ALEX_SYSTEM = `You are Alex, a professional AI SDR at Leadforces.
Your goal is to qualify leads using BANT.
IMPORTANT RULES:
- You MUST respond in Hindi (हिंदी) only, using Devnagari script.
- Ask exactly ONE short, natural question in Hindi per turn.
- Acknowledge what the user said in Hindi before asking the next question.
- Sound warm, polite, and helpful (like a professional Indian salesperson).
- Keep every Hindi response under 25-30 words.
- Extraction rules (Budget, Authority, Need, Timeline) still apply internally.`;

export async function selectFramework(transcript) {
  const prompt = `Based on this B2B sales conversation, choose the best qualification framework:
BANT: simple deal, single decision-maker, short sales cycle (<90 days)
MEDDIC: enterprise deal, multiple stakeholders, complex procurement, >$50k ACV
Conversation so far:
${transcript}
Rules:
- Reply with ONLY one word: BANT or MEDDIC
- If unsure, default to BANT`;
  const raw = await generateText(
    'You output only one word: BANT or MEDDIC.',
    prompt,
    { temperature: 0, maxOutputTokens: 10 }
  );
  return raw.toUpperCase().includes('MEDDIC') ? 'MEDDIC' : 'BANT';
}

export async function nextQuestion(framework, completedFields, historySnippet, shortTranscript) {
  const filled =
    Object.entries(completedFields)
      .filter(([, v]) => v != null && v !== '')
      .map(([k]) => k)
      .join(', ') || 'none yet';
  const userPrompt = `Qualification framework: ${framework}
Fields already collected: ${filled}
Conversation so far:
${shortTranscript}
Pick the single most important MISSING field and ask ONE short, natural,
conversational question to collect it. Do NOT mention the framework name.
Respond with ONLY the question — no preamble.

CURRENT EXTRACTED DATA: ${JSON.stringify(completedFields)}
CONVERSATION HISTORY (recent): ${historySnippet}
FRAMEWORK IN USE: ${framework}`;
  return generateText(ALEX_SYSTEM, userPrompt, { temperature: 0.4, maxOutputTokens: 120 });
}

export function parseJsonObject(raw) {
  const cleaned = raw.replace(/```json\s*|```/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function extractFields(userInput, existingData) {
  const prompt = `Given this prospect response: "${userInput}"
And previous extracted data: ${JSON.stringify(existingData)}
Extract any of the following that are now answerable:
budget (number in USD or "approved"/"not approved"),
authority ("decision_maker" | "influencer" | "unknown"),
need (free text, max 20 words),
timeline (e.g. "30 days", "Q2 2025", "no urgency").
Reply ONLY with a JSON object — keys: budget, authority, need, timeline.
Use null for fields not yet known. No extra text.`;
  const raw = await generateText(
    'You reply only with valid JSON objects, no markdown.',
    prompt,
    { temperature: 0, maxOutputTokens: 256 }
  );
  const parsed = parseJsonObject(raw);
  if (!parsed) return { ...existingData };
  return {
    budget: parsed.budget ?? existingData.budget ?? null,
    authority: parsed.authority ?? existingData.authority ?? null,
    need: parsed.need ?? existingData.need ?? null,
    timeline: parsed.timeline ?? existingData.timeline ?? null,
  };
}

export async function scoreDimensionLLM(dimension, userInput) {
  const prompt = `Score B2B prospect on the ${dimension} dimension 0-100.
0=very weak. 100=extremely strong.
Prospect said: "${userInput}"
Reply with only an integer.`;
  const raw = await generateText(
    'You reply with only an integer from 0 to 100.',
    prompt,
    { temperature: 0, maxOutputTokens: 8 }
  );
  const n = parseInt(String(raw).replace(/\D/g, ''), 10);
  if (Number.isNaN(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

export async function summarizeCdrInsights(transcriptSummary, extractedData, framework) {
  const prompt = `You are summarizing a sales call for a CDR report.
Framework: ${framework}
Extracted fields: ${JSON.stringify(extractedData)}
Transcript summary: ${transcriptSummary}
Return ONLY valid JSON with keys:
key_insights (array of 4 short strings),
objections_raised (array of strings, can be empty),
next_action (one string).
No markdown.`;
  const raw = await generateText(
    'You output only JSON.',
    prompt,
    { temperature: 0.3, maxOutputTokens: 512 }
  );
  const parsed = parseJsonObject(raw);
  if (!parsed) {
    return {
      key_insights: [],
      objections_raised: [],
      next_action: 'Follow up with prospect',
    };
  }
  return {
    key_insights: Array.isArray(parsed.key_insights) ? parsed.key_insights : [],
    objections_raised: Array.isArray(parsed.objections_raised) ? parsed.objections_raised : [],
    next_action: typeof parsed.next_action === 'string' ? parsed.next_action : 'Follow up',
  };
}
