# Leadforces

Voice AI sales qualification demo: **Twilio** → **Express** → **Deepgram** + **Google Gemini** + **Cartesia** (or Twilio `<Say>`) → **Supabase** (Postgres + Storage). **React** dashboard.

## Quick start

1. **Supabase**: Create a project, run [`backend/schema.sql`](backend/schema.sql) in the SQL editor. Create a **private** Storage bucket named `tts` (or set `SUPABASE_STORAGE_BUCKET`).

2. **Backend env**: Copy `backend/.env.example` to `backend/.env` and fill in values. Set `PUBLIC_BASE_URL` to your public HTTPS URL (e.g. ngrok) for Twilio webhooks.

3. **Twilio**: Point the phone number **Voice webhook** to `POST https://<PUBLIC_BASE_URL>/api/twilio/voice`. Set **Status callback** to `POST https://<PUBLIC_BASE_URL>/api/calls/status` (required for call completion + CDR).

4. **Run API**:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. **Run dashboard**:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`. The Vite dev server proxies `/api` to port `3000`.

6. **Production frontend**: Set `VITE_API_URL` to your deployed API origin (e.g. `https://api.yourapp.com`).

## Stack

Twilio · Deepgram · Cartesia · Gemini · Supabase · Express · React · Vite
