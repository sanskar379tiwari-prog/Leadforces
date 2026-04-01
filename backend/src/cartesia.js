import axios from 'axios';
import { uploadTtsMp3 } from './storage.js';

const VOICE_ID = process.env.CARTESIA_VOICE_ID || 'b10f179c-66ee-4be9-9eec-a44fef1fb5d8';

export async function synthesizeToPlayableUrl(text) {
  const key = process.env.CARTESIA_API_KEY;
  const useFallback = process.env.CARTESIA_FALLBACK === 'true' || !key;
  if (useFallback) return { url: null, useSay: true };

  try {
    const resp = await axios.post(
      'https://api.cartesia.ai/tts/bytes',
      {
        transcript: text,
        model_id: 'sonic-english',
        voice: { mode: 'id', id: VOICE_ID },
        output_format: {
          container: 'mp3',
          encoding: 'mp3',
          sample_rate: 44100,
        },
      },
      {
        headers: {
          'X-API-Key': key,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 12000,
      }
    );
    const buffer = Buffer.from(resp.data);
    const filename = `${Date.now()}.mp3`;
    const url = await uploadTtsMp3(buffer, filename);
    if (!url) return { url: null, useSay: true };
    return { url, useSay: false };
  } catch (e) {
    console.error('Cartesia TTS error:', e.message);
    return { url: null, useSay: true };
  }
}
