import axios from 'axios';
import { uploadTtsMp3 } from './storage.js';

const INDICF5_SPACE = process.env.INDICF5_SPACE_URL || 'https://ai4bharat-indicf5.hf.space';

/**
 * Synthesize Hindi text to audio using AI4Bharat IndicF5 (public HF Space).
 * No API key required — it's a free, public Gradio endpoint.
 */
export async function synthesizeToPlayableUrl(text) {
  if (!text || text.trim().length === 0) {
    return { url: null, useSay: true };
  }

  try {
    // Step 1: Call the Gradio predict API
    const resp = await axios.post(
      `${INDICF5_SPACE}/api/predict`,
      {
        data: [
          text,     // text to synthesize
          'hi',     // language: Hindi
          null,     // reference audio (optional)
          null,     // reference text (optional)
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, // IndicF5 can take time on cold start
      }
    );

    // Gradio returns { data: [ { name: "...", data: "base64...", is_file: true } ] }
    const result = resp.data?.data?.[0];

    if (!result) {
      console.warn('IndicF5: empty response, falling back to Twilio Say');
      return { url: null, useSay: true };
    }

    let audioBuffer;

    if (result.data) {
      // Base64 encoded audio
      const base64 = result.data.replace(/^data:audio\/\w+;base64,/, '');
      audioBuffer = Buffer.from(base64, 'base64');
    } else if (result.name || result.url) {
      // File URL returned — download it
      const fileUrl = result.url || `${INDICF5_SPACE}/file=${result.name}`;
      const audioResp = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      audioBuffer = Buffer.from(audioResp.data);
    } else {
      console.warn('IndicF5: unexpected response format');
      return { url: null, useSay: true };
    }

    // Step 2: Upload to Supabase storage for Twilio to play
    const filename = `tts-indicf5-${Date.now()}.wav`;
    const url = await uploadTtsMp3(audioBuffer, filename);

    if (!url) return { url: null, useSay: true };
    return { url, useSay: false };

  } catch (e) {
    console.error('IndicF5 TTS error:', e.response?.status, e.message);
    // Graceful fallback — Alex will use Twilio's built-in Say so the call doesn't hang
    return { url: null, useSay: true };
  }
}
