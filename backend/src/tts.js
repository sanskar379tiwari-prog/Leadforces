import axios from 'axios';
import { uploadTtsMp3 } from './storage.js';

/**
 * Synthesize text into a playable MP3 URL using Hugging Face IndicF5 via Inference API.
 */
export async function synthesizeToPlayableUrl(text) {
  const hfToken = process.env.HUGGING_FACE_TOKEN;
  const modelId = process.env.HF_TTS_MODEL_ID || 'ai4bharat/IndicF5';
  
  if (!hfToken) {
    console.warn('HUGGING_FACE_TOKEN not set, falling back to Twilio Say.');
    return { url: null, useSay: true };
  }

  try {
    const resp = await axios.post(
      `https://api-inference.huggingface.co/models/${modelId}`,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 30000, // TTS on HF can be slow
      }
    );

    const buffer = Buffer.from(resp.data);
    const filename = `tts-hf-${Date.now()}.mp3`;
    const url = await uploadTtsMp3(buffer, filename);
    
    if (!url) return { url: null, useSay: true };
    return { url, useSay: false };
  } catch (e) {
    console.error('Hugging Face TTS error:', e.response?.data?.toString() || e.message);
    return { url: null, useSay: true };
  }
}
