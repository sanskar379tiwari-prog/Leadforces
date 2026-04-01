import { createClient } from '@deepgram/sdk';

export async function transcribeFromBuffer(audioBuffer, mimetype = 'audio/wav') {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return null;
  try {
    const dg = createClient(key);
    const { result, error } = await dg.listen.prerecorded.transcribeFile(audioBuffer, {
      model: process.env.DEEPGRAM_MODEL || 'nova-2',
      smart_format: true,
      punctuate: true,
      language: 'hi',
    });
    if (error) {
      console.error('Deepgram error:', error);
      return null;
    }
    const alt = result?.results?.channels?.[0]?.alternatives?.[0];
    return alt?.transcript?.trim() || null;
  } catch (e) {
    console.error('Deepgram transcribe:', e.message);
    return null;
  }
}

/**
 * If RecordingUrl present, fetch audio and transcribe; else return null.
 */
export async function enhanceTranscript(speechResult, recordingUrl) {
  const fallback = process.env.DEEPGRAM_FALLBACK === 'true';
  if (fallback || !process.env.DEEPGRAM_API_KEY) {
    return speechResult || '';
  }
  if (!recordingUrl) return speechResult || '';
  try {
    const res = await fetch(recordingUrl);
    if (!res.ok) return speechResult || '';
    const buf = Buffer.from(await res.arrayBuffer());
    const dgText = await transcribeFromBuffer(buf, res.headers.get('content-type') || 'audio/wav');
    return dgText || speechResult || '';
  } catch {
    return speechResult || '';
  }
}
