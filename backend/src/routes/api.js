import { Router } from 'express';
import twilio from 'twilio';
import { enhanceTranscript } from '../deepgram.js';
import { synthesizeToPlayableUrl } from '../cartesia.js';
import {
  selectFramework,
  nextQuestion,
  extractFields,
} from '../gemini.js';
import { scoreDimension } from '../scoring.js';
import {
  ensureLead,
  ensureCallLog,
  countProspectTurns,
  maxTurnNumber,
  appendTranscript,
  updateLeadExtracted,
  setFramework,
  saveTurn,
  updateLeadScore,
  listLeads,
  getLeadById,
  getTurns,
  listLeadsForCsv,
  updateCallLogStatus,
} from '../repositories/leads.js';
import { finalizeCall } from '../callService.js';
import { pingDb } from '../db.js';
import { TWILIO_SAY_OPTS } from '../twilioVoice.js';

const VoiceResponse = twilio.twiml.VoiceResponse;

function baseUrl() {
  const b = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return b.replace(/\/$/, '');
}

export function registerApiRoutes(app) {
  const router = Router();

  router.get('/health', async (_req, res) => {
    try {
      await pingDb();
      res.json({ status: 'ok', db: 'connected' });
    } catch (e) {
      res.status(500).json({ status: 'error', db: 'disconnected', message: e.message });
    }
  });

  router.get('/leads', async (_req, res) => {
    try {
      const rows = await listLeads(50);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/leads/export/csv', async (_req, res) => {
    try {
      const rows = await listLeadsForCsv();
      const header =
        'lead_id,phone_number,score,qualified,framework,budget,authority,need,timeline,created_at\n';
      const body = rows
        .map((r) =>
          [
            r.lead_id,
            r.phone_number,
            r.score,
            r.qualified,
            r.framework,
            csvEscape(r.budget),
            csvEscape(r.authority),
            csvEscape(r.need),
            csvEscape(r.timeline),
            r.created_at?.toISOString?.() || r.created_at,
          ].join(',')
        )
        .join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
      res.send(header + body);
    } catch (e) {
      res.status(500).send(e.message);
    }
  });

  router.get('/leads/:id', async (req, res) => {
    try {
      const lead = await getLeadById(req.params.id);
      if (!lead) return res.status(404).json({ error: 'Not found' });
      const turns = await getTurns(req.params.id);
      const cdr = lead.cdr_json;
      const dimension_scores =
        cdr?.dimension_scores || {
          Budget: lead.score ? Math.round(lead.score * 0.25) : 0,
          Authority: lead.score ? Math.round(lead.score * 0.25) : 0,
          Need: lead.score ? Math.round(lead.score * 0.25) : 0,
          Timeline: lead.score ? Math.round(lead.score * 0.25) : 0,
        };
      res.json({
        lead_id: lead.lead_id,
        prospect_name: lead.prospect_name,
        phone_number: lead.phone_number,
        company: lead.company,
        overall_score: cdr?.overall_score ?? lead.score ?? 0,
        qualification: cdr?.qualification ?? lead.qualified ?? 'PENDING',
        framework: lead.framework,
        dimension_scores,
        budget: lead.budget,
        authority: lead.authority,
        need: lead.need,
        timeline: lead.timeline,
        call_transcript: lead.call_transcript,
        cdr_json: cdr,
        turns,
        created_at: lead.created_at,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/twilio/voice', async (req, res) => {
    const { CallSid, From } = req.body;
    if (CallSid) {
      try {
        const lead = await ensureLead(CallSid, From);
        await ensureCallLog(CallSid, lead.lead_id, From);
      } catch (e) {
        console.error('twilio/voice lead init:', e.message);
      }
    }
    const twiml = new VoiceResponse();
    const gather = twiml.gather({
      input: 'speech',
      action: `${baseUrl()}/api/calls/process-speech`,
      method: 'POST',
      timeout: 5,
      speechTimeout: 'auto',
      language: 'hi-IN',
    });
    gather.say(TWILIO_SAY_OPTS, 'नमस्ते, मैं लीडफोर्सेस से एलेक्स हूँ। क्या आपके पास एक पल है?');
    twiml.redirect(`${baseUrl()}/api/twilio/voice`);
    res.type('text/xml').send(twiml.toString());
  });

  router.post('/calls/process-speech', async (req, res) => {
    const { CallSid, From, SpeechResult, RecordingUrl } = req.body;
    const twiml = new VoiceResponse();

    if (!CallSid) {
      twiml.say(TWILIO_SAY_OPTS, 'Sorry, something went wrong.');
      res.type('text/xml').send(twiml.toString());
      return;
    }

    try {
      const lead = await ensureLead(CallSid, From);
      await ensureCallLog(CallSid, lead.lead_id, From);

      const speech = SpeechResult || '';
      const transcript = await enhanceTranscript(speech, RecordingUrl);

      const priorProspect = await countProspectTurns(lead.lead_id);
      const fullTranscriptSoFar = `${lead.call_transcript || ''}\nProspect: ${transcript}`;

      // Second prospect utterance: choose BANT vs MEDDIC once (PDF: after ~2 turns)
      if (priorProspect === 1) {
        const fw = await selectFramework(fullTranscriptSoFar.slice(-4000));
        await setFramework(lead.lead_id, fw);
        lead.framework = fw;
      }

      const existingData = {
        budget: lead.budget,
        authority: lead.authority,
        need: lead.need,
        timeline: lead.timeline,
      };

      let newFields;
      try {
        newFields = await extractFields(transcript, existingData);
      } catch {
        newFields = existingData;
      }

      const turnScore = await scoreDimension('need', transcript);
      const nextTurn = (await maxTurnNumber(lead.lead_id)) + 1;

      await saveTurn(lead.lead_id, nextTurn, 'prospect', transcript, newFields, turnScore);
      await updateLeadExtracted(lead.lead_id, newFields);
      await appendTranscript(lead.lead_id, `\nProspect: ${transcript}`);

      const refreshed = await getLeadById(CallSid);
      const fw = refreshed?.framework || 'BANT';

      const question = await nextQuestion(
        fw,
        {
          budget: newFields.budget,
          authority: newFields.authority,
          need: newFields.need,
          timeline: newFields.timeline,
        },
        (refreshed?.call_transcript || '').slice(-800),
        fullTranscriptSoFar.slice(-600)
      );

      const agentTurn = nextTurn + 1;
      await saveTurn(lead.lead_id, agentTurn, 'agent', question, newFields, turnScore);
      await appendTranscript(lead.lead_id, `\nAgent: ${question}`);

      const running = Math.min(100, (lead.score || 0) + Math.round(turnScore / 10));
      await updateLeadScore(lead.lead_id, running, refreshed?.qualified || 'PENDING');

      const { url: audioUrl, useSay } = await synthesizeToPlayableUrl(question);

      const gather2 = twiml.gather({
        input: 'speech',
        action: `${baseUrl()}/api/calls/process-speech`,
        method: 'POST',
        timeout: 5,
        speechTimeout: 'auto',
        language: 'hi-IN',
      });

      if (!useSay && audioUrl) {
        gather2.play(audioUrl);
      } else {
        gather2.say(TWILIO_SAY_OPTS, question);
      }

      twiml.redirect(`${baseUrl()}/api/twilio/voice`);
    } catch (err) {
      console.error('process-speech error:', err);
      const gather3 = twiml.gather({
        input: 'speech',
        action: `${baseUrl()}/api/calls/process-speech`,
        method: 'POST',
        timeout: 5,
        speechTimeout: 'auto',
      });
      gather3.say(TWILIO_SAY_OPTS, 'Sorry, could you repeat that?');
      twiml.redirect(`${baseUrl()}/api/twilio/voice`);
    }

    res.type('text/xml').send(twiml.toString());
  });

  router.post('/calls/status', async (req, res) => {
    const { CallSid, CallStatus, CallDuration, RecordingUrl } = req.body;
    try {
      if (CallSid && (CallStatus === 'completed' || CallStatus === 'busy' || CallStatus === 'no-answer')) {
        const duration = CallDuration ? parseInt(CallDuration, 10) : 0;
        if (CallStatus === 'completed') {
          await finalizeCall(CallSid, {
            durationSeconds: duration,
            recordingUrl: RecordingUrl,
            callStatus: CallStatus,
          });
        } else {
          await updateCallLogStatus(CallSid, CallStatus, duration, RecordingUrl);
        }
      }
    } catch (e) {
      console.error('call status error:', e);
    }
    res.type('text/xml').send(new VoiceResponse().toString());
  });

  router.post('/calls/finalize', async (req, res) => {
    try {
      const id = req.body.callSid || req.body.lead_id;
      if (!id) return res.status(400).json({ error: 'callSid required' });
      const cdr = await finalizeCall(id, { durationSeconds: req.body.durationSeconds });
      res.json({ ok: true, cdr });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.use('/api', router);
}

function csvEscape(val) {
  if (val == null) return '';
  const s = String(val).replace(/"/g, '""');
  if (/[",\n]/.test(s)) return `"${s}"`;
  return s;
}
