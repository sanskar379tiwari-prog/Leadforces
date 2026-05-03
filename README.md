# 🚀 Leadforces: AI Sales Qualification Agent
**Leadforces** is an autonomous, voice-based AI Sales Development Representative (SDR) designed to eliminate the 50% of time sales teams waste on unqualified leads. Using a dual-framework engine, it conducts natural discovery calls, scores prospects in real-time, and generates structured handoff reports.
## 🛠️ Tech Stack

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Telephony** | **Twilio Voice** | PSTN gateway and call handling. |
| **Speech-to-Text** | **Deepgram Nova-3** | Real-time transcription with >95% accuracy. |
| **LLM / Brain** | **Google Gemini** | Context-aware reasoning and framework selection. |
| **Text-to-Speech** | **Cartesia Sonic** | High-fidelity, ultra-low latency human voice synthesis. |
| **Database** | **Supabase (PostgreSQL)** | Persistent storage for leads, transcripts, and scores. |
| **Backend** | **Express.js** | Central orchestration API hosted on **Render**. |
| **Frontend** | **React + Vite** | Real-time monitoring dashboard hosted on **Vercel**. |

## ✨ Key Features
 * **Dual Framework Engine:** Adaptive selection between BANT (Budget, Authority, Need, Timeline) and MEDDIC based on initial prospect signals.
 * **Live Call Scoring:** Hybrid rule-based and LLM scoring that updates dynamically with every speech turn.
 * **Real-Time Dashboard:** Monitor active calls with live transcription feeds and animated score bars powered by Framer Motion.
 * **Automated CDR:** Generates a full Call Detail Record (CDR) including key insights, objections, and next actions upon call completion.
 * **CRM-Ready:** Designed for one-click routing of qualified leads to platforms like Salesforce or HubSpot.
## 🏗️ System Architecture
 1. **Inbound/Outbound:** Twilio routes the PSTN call to the Render-hosted backend webhook.
 2. **Transcription:** Speech is captured and enhanced via Deepgram Nova-3.
 3. **Reasoning:** Google Gemini analyzes the transcript against BANT/MEDDIC criteria to determine the next conversational step.
 4. **Synthesis:** Text is converted to audio via Cartesia and played back to the caller.
 5. **Finalization:** The call is scored, archived in Supabase, and pushed to the dashboard via polling/WebSockets.
## 🚀 Deployment & Setup
### 1. Database Configuration
 * Create a project in **Supabase**.
 * Execute the schema found in backend/schema.sql within the Supabase SQL Editor.
 * Create a private storage bucket named tts for audio caching.
### 2. Backend Environment (Render)
Configure your **Render** environment variables:
 * PUBLIC_BASE_URL: Your Render service URL (e.g., https://leadforces-api.onrender.com).
 * FRONTEND_URL: Your Vercel production URL for CORS.
 * DATABASE_URL: Your Supabase connection string (Transaction Pooler recommended).
 * Add API keys for **Twilio**, **Deepgram**, **Gemini**, and **Cartesia**.
### 3. Frontend Environment (Vercel)
Configure your **Vercel** build variables:
 * VITE_API_URL: Your Render API origin (e.g., https://leadforces-api.onrender.com).
### 4. Twilio Integration
Point your Twilio number's **Voice Webhook** to:
POST https://<YOUR_RENDER_URL>/api/twilio/voice.
## 👥 The Team
Developed during an 18-hour intensive sprint by:
 * **Sanskar Tiwari**
 * **Shreyan Prasad**
 * **Ayush Gupta**