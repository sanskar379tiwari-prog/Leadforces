# 🚀 Leadforces: AI Sales Qualification Agent
**Leadforces** is an autonomous, voice-based AI Sales Development Representative (SDR) designed to eliminate the 50% of time sales teams waste on unqualified leads. Using a dual-framework engine, it conducts natural discovery calls, scores prospects in real-time, and pushes high-intent leads directly to your CRM.
## 🛠️ Tech Stack

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Telephony** | **Twilio Voice** | PSTN gateway and call handling. |
| **Speech-to-Text** | **Deepgram Nova-3** | Real-time transcription with >95% accuracy. |
| **LLM / Brain** | **Google Gemini** | Context-aware reasoning and framework selection. |
| **Text-to-Speech** | **Cartesia Sonic** | High-fidelity, ultra-low latency human voice synthesis. |
| **Database** | **Supabase (PostgreSQL)** | Persistent storage for leads, transcripts, and scores. |
| **Backend** | **Express.js** | Central orchestration API hosted on Railway. |
| **Frontend** | **React + Vite** | Real-time monitoring dashboard with Framer Motion. |

## ✨ Key Features
 * **Dual Framework Engine:** Adaptive BANT (Budget, Authority, Need, Timeline) or MEDDIC selection based on prospect signals.
 * **Live Call Scoring:** Hybrid rule-based and LLM scoring that updates per speech turn.
 * **Real-Time Dashboard:** Monitor active calls with live transcription feeds and animated score bars.
 * **Automated CDR:** Generates a full Call Detail Record (CDR) including summaries, objections, and next actions upon hang-up.
 * **CRM Integration:** One-click routing of qualified prospects to Salesforce or HubSpot.
## 🏗️ System Architecture
 1. **Inbound/Outbound:** Twilio routes the PSTN call to the backend webhook.
 2. **Transcription:** Speech is captured and enhanced via Deepgram Nova-3.
 3. **Reasoning:** Gemini analyzes the transcript against BANT/MEDDIC criteria and generates the next conversational question.
 4. **Synthesis:** Text is converted to audio via Cartesia and played back to the caller in milliseconds.
 5. **Finalization:** The call is scored, stored in Supabase, and reflected on the React dashboard.
## 🚀 Quick Start
### 1. Database Setup
 * Create a project in **Supabase**.
 * Run the schema found in backend/schema.sql in the Supabase SQL Editor.
 * Create a **private** storage bucket named tts for caching audio files.
### 2. Backend Configuration
Navigate to the backend directory and configure your environment:
```bash
cp .env.example .env
```
Fill in the following essential keys:
 * PUBLIC_BASE_URL: Your public HTTPS URL (use **ngrok** for local development).
 * DATABASE_URL: Your Supabase connection string (use Transaction Pooler).
 * API Keys for **Twilio**, **Deepgram**, **Gemini**, and **Cartesia**.
### 3. Twilio Webhook
Point your Twilio phone number's **Voice Webhook** to:
POST https://<YOUR_PUBLIC_URL>/api/twilio/voice.
### 4. Installation & Deployment
**Start the Backend:**
```bash
cd backend
npm install
npm run dev
```
**Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The Vite server is pre-configured to proxy /api requests to the backend on port 3000.
## 👥 The Team
Developed in an 18-hour sprint by:
 * **Sanskar Tiwari** – Infrastructure & Telephony
 * **Shreyan Prasad** – AI/ML & Prompt Engineering
 * **Ayush Gupta** – Full-Stack Development & Integration
*Built for the 2026 AI Innovation Hackathon.*