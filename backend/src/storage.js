import { createClient } from '@supabase/supabase-js';

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'tts';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Upload MP3 bytes; returns signed URL for Twilio <Play> or null if misconfigured.
 */
export async function uploadTtsMp3(buffer, filename) {
  const supabase = getClient();
  if (!supabase) return null;
  const path = filename;
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: 'audio/mpeg',
    upsert: true,
  });
  if (error) {
    console.error('Supabase upload error:', error.message);
    return null;
  }
  const { data, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 300);
  if (signErr || !data?.signedUrl) {
    console.error('Supabase signed URL error:', signErr?.message);
    return null;
  }
  return data.signedUrl;
}
