import { query } from '../db.js';

export async function ensureLead(callSid, phoneNumber) {
  const existing = await query('SELECT * FROM leads WHERE lead_id = $1', [callSid]);
  if (existing.rows[0]) return existing.rows[0];

  await query(
    `INSERT INTO leads (lead_id, phone_number, qualified, framework)
     VALUES ($1, $2, 'PENDING', 'BANT')
     ON CONFLICT (lead_id) DO NOTHING`,
    [callSid, phoneNumber || null]
  );
  const res = await query('SELECT * FROM leads WHERE lead_id = $1', [callSid]);
  return res.rows[0];
}

export async function ensureCallLog(callSid, leadId, phoneNumber) {
  const existing = await query('SELECT * FROM call_logs WHERE call_id = $1', [callSid]);
  if (existing.rows[0]) return existing.rows[0];
  await query(
    `INSERT INTO call_logs (call_id, lead_id, phone_number, status)
     VALUES ($1, $2, $3, 'active')`,
    [callSid, leadId, phoneNumber || null]
  );
  const res = await query('SELECT * FROM call_logs WHERE call_id = $1', [callSid]);
  return res.rows[0];
}

export async function countTurns(leadId) {
  const r = await query(
    'SELECT COUNT(*)::int AS c FROM conversation_turns WHERE lead_id = $1',
    [leadId]
  );
  return r.rows[0]?.c ?? 0;
}

export async function countProspectTurns(leadId) {
  const r = await query(
    `SELECT COUNT(*)::int AS c FROM conversation_turns WHERE lead_id = $1 AND role = 'prospect'`,
    [leadId]
  );
  return r.rows[0]?.c ?? 0;
}

export async function maxTurnNumber(leadId) {
  const r = await query(
    'SELECT COALESCE(MAX(turn_number), 0)::int AS m FROM conversation_turns WHERE lead_id = $1',
    [leadId]
  );
  return r.rows[0]?.m ?? 0;
}

export async function appendTranscript(leadId, line) {
  await query(
    `UPDATE leads SET call_transcript = COALESCE(call_transcript,'') || $2 WHERE lead_id = $1`,
    [leadId, line]
  );
}

export async function updateLeadExtracted(leadId, fields) {
  await query(
    `UPDATE leads SET budget = $2, authority = $3, need = $4, timeline = $5, framework = COALESCE($6, framework)
     WHERE lead_id = $1`,
    [
      leadId,
      fields.budget,
      fields.authority,
      fields.need,
      fields.timeline,
      fields.framework ?? null,
    ]
  );
}

export async function setFramework(leadId, framework) {
  await query('UPDATE leads SET framework = $2 WHERE lead_id = $1', [leadId, framework]);
}

export async function saveTurn(leadId, turnNumber, role, text, extractedData, turnScore) {
  await query(
    `INSERT INTO conversation_turns (lead_id, turn_number, role, text, extracted_data, turn_score)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [leadId, turnNumber, role, text, JSON.stringify(extractedData), turnScore]
  );
}

export async function updateLeadScore(leadId, score, qualified) {
  await query('UPDATE leads SET score = $2, qualified = $3 WHERE lead_id = $1', [
    leadId,
    score,
    qualified,
  ]);
}

export async function listLeads(limit = 50) {
  const r = await query(
    `SELECT lead_id, prospect_name, phone_number, company, score, qualified, framework, created_at
     FROM leads ORDER BY score DESC, created_at DESC LIMIT $1`,
    [limit]
  );
  return r.rows;
}

export async function getLeadById(leadId) {
  const r = await query('SELECT * FROM leads WHERE lead_id = $1', [leadId]);
  return r.rows[0] || null;
}

export async function getTurns(leadId) {
  const r = await query(
    `SELECT turn_number, role, text, extracted_data, turn_score, created_at
     FROM conversation_turns WHERE lead_id = $1 ORDER BY turn_number ASC`
  , [leadId]);
  return r.rows;
}

export async function insertScoringDetail(leadId, framework, scores) {
  await query(
    `INSERT INTO scoring_details (lead_id, framework, budget_score, authority_score, need_score, timeline_score, total_score, qualified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      leadId,
      framework,
      scores.budget,
      scores.authority,
      scores.need,
      scores.timeline,
      scores.total,
      scores.qualified,
    ]
  );
}

export async function updateCallLogStatus(callSid, status, durationSeconds, recordingUrl) {
  await query(
    `UPDATE call_logs SET status = $2, duration_seconds = COALESCE($3, duration_seconds),
     recording_url = COALESCE($4, recording_url) WHERE call_id = $1`,
    [callSid, status, durationSeconds, recordingUrl]
  );
}

export async function finalizeLeadCdr(leadId, cdrJson) {
  await query(
    `UPDATE leads SET cdr_json = $2::jsonb, score = $3, qualified = $4 WHERE lead_id = $1`,
    [leadId, JSON.stringify(cdrJson), cdrJson.overall_score, cdrJson.qualification]
  );
}

export async function listLeadsForCsv() {
  const r = await query(
    `SELECT lead_id, phone_number, score, qualified, framework, budget, authority, need, timeline, created_at
     FROM leads ORDER BY created_at DESC`
  );
  return r.rows;
}
