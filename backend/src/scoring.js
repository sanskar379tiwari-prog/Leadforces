import { scoreDimensionLLM } from './gemini.js';

const KEYWORD_RULES = {
  budget: [
    { pattern: /budget.*(approved|confirmed|ready|allocated)/i, score: 90 },
    { pattern: /no budget|no money|no funding|cut budget/i, score: 15 },
    { pattern: /exploring|considering|evaluating/i, score: 45 },
  ],
  authority: [
    { pattern: /i (decide|approve|own)|i'm responsible|sole/i, score: 85 },
    { pattern: /not (the|a) decision|need to ask|my boss/i, score: 20 },
    { pattern: /vp|director|cto|ceo|head of/i, score: 70 },
  ],
  need: [
    { pattern: /urgent|asap|critical|losing|hemorrhaging/i, score: 88 },
    { pattern: /nice.to.have|not urgent|maybe someday/i, score: 22 },
    { pattern: /problem|challenge|pain|struggle/i, score: 65 },
  ],
  timeline: [
    { pattern: /\d+\s*(day|week)/i, score: 82 },
    { pattern: /this (quarter|month|week)/i, score: 78 },
    { pattern: /next year|not sure when|eventually/i, score: 25 },
  ],
};

export async function scoreDimension(dimension, userInput) {
  const text = String(userInput || '');
  const rules = KEYWORD_RULES[dimension] || [];
  for (const rule of rules) {
    if (rule.pattern.test(text)) return rule.score;
  }
  return scoreDimensionLLM(dimension, text || 'unknown');
}

export async function scoreBANT(extractedData) {
  const b = await scoreDimension('budget', extractedData.budget || '');
  const a = await scoreDimension('authority', extractedData.authority || '');
  const n = await scoreDimension('need', extractedData.need || '');
  const t = await scoreDimension('timeline', extractedData.timeline || '');
  const total = Math.round((b + a + n + t) / 4);
  const qualified =
    total >= 70 ? 'QUALIFIED' : total >= 50 ? 'NURTURE' : 'DISQUALIFIED';
  return {
    budget: b,
    authority: a,
    need: n,
    timeline: t,
    total,
    qualified,
    dimension_scores: {
      Budget: b,
      Authority: a,
      Need: n,
      Timeline: t,
    },
  };
}

/** Lightweight MEDDIC-style aggregate using same dimensions + text blob */
export async function scoreMEDDIC(extractedData, transcriptBlob) {
  const blob = [
    extractedData.need,
    extractedData.timeline,
    extractedData.budget,
    extractedData.authority,
    transcriptBlob,
  ]
    .filter(Boolean)
    .join(' ');
  const m = await scoreDimension('need', blob);
  const e = await scoreDimension('budget', blob);
  const d1 = await scoreDimension('authority', blob);
  const d2 = await scoreDimension('timeline', blob);
  const total = Math.round((m + e + d1 + d2) / 4);
  const qualified =
    total >= 70 ? 'QUALIFIED' : total >= 50 ? 'NURTURE' : 'DISQUALIFIED';
  return {
    budget: e,
    authority: d1,
    need: m,
    timeline: d2,
    total,
    qualified,
    dimension_scores: {
      Budget: e,
      Authority: d1,
      Need: m,
      Timeline: d2,
    },
  };
}
