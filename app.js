import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { PUBLIC_DIR, UPLOAD_DIR } from './config/paths.js';

const app = express();
const clientOrigins = (process.env.CLIENT_URLS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: clientOrigins }));
app.use(express.json({ limit: '16mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { fallthrough: false }));
app.use(express.static(PUBLIC_DIR));
app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
