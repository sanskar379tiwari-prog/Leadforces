import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { registerApiRoutes } from './routes/api.js';
import { pingDb } from './db.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
// Railway (and most PaaS) require listening on all interfaces — not localhost-only.
const host = process.env.HOST || '0.0.0.0';

const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: [frontend, /^https:\/\/.*\.vercel\.app$/],
  })
);

app.use('/api/calls/status', express.urlencoded({ extended: false }));
app.use('/api/twilio/voice', express.urlencoded({ extended: false }));
app.use('/api/calls/process-speech', express.urlencoded({ extended: false }));
app.use('/api/calls/finalize', express.json());
app.use('/api', express.json());

registerApiRoutes(app);

app.get('/', (_req, res) => {
  res.json({ name: 'Leadforces API', health: '/api/health' });
});

app
  .listen(port, host, async () => {
    console.log(`Leadforces API listening on ${host}:${port}`);
    try {
      await pingDb();
      console.log('Database connected');
    } catch (e) {
      console.warn('Database ping failed:', e.message);
    }
  })
  .on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
