import {
  getLeadById,
  insertScoringDetail,
  finalizeLeadCdr,
  updateCallLogStatus,
} from './repositories/leads.js';
import { scoreBANT, scoreMEDDIC } from './scoring.js';
import { summarizeCdrInsights } from './gemini.js';

export async function finalizeCall(callSid, { durationSeconds, recordingUrl, callStatus } = {}) {
  const lead = await getLeadById(callSid);
  if (!lead) return null;

  if (lead.cdr_json != null) {
    await updateCallLogStatus(callSid, callStatus || 'completed', durationSeconds, recordingUrl);
    return lead.cdr_json;
  }

  await updateCallLogStatus(callSid, callStatus || 'completed', durationSeconds, recordingUrl);

  const extracted = {
    budget: lead.budget,
    authority: lead.authority,
    need: lead.need,
    timeline: lead.timeline,
  };
  const framework = lead.framework || 'BANT';
  const transcript = lead.call_transcript || '';

  const scores =
    framework === 'MEDDIC'
      ? await scoreMEDDIC(extracted, transcript)
      : await scoreBANT(extracted);

  const insights = await summarizeCdrInsights(
    transcript.slice(-2000),
    extracted,
    framework
  );

  const cdr = {
    session_id: callSid,
    framework_used: framework,
    overall_score: scores.total,
    qualification: scores.qualified,
    dimension_scores: scores.dimension_scores,
    key_insights: insights.key_insights,
    objections_raised: insights.objections_raised,
    next_action: insights.next_action,
    call_duration_seconds: durationSeconds ?? 0,
    transcript_summary: transcript.slice(0, 800),
  };

  await insertScoringDetail(callSid, framework, {
    budget: scores.budget,
    authority: scores.authority,
    need: scores.need,
    timeline: scores.timeline,
    total: scores.total,
    qualified: scores.qualified,
  });

  await finalizeLeadCdr(callSid, cdr);
  return cdr;
}
