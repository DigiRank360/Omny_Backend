import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import routes from './routes/index.js';
import seedAdmin from './utils/seedAdmin.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();
const clientOrigins = (process.env.CLIENT_URLS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: clientOrigins }));
app.use(express.json({ limit: '16mb' }));
app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

connectDB().then(async () => {
  await seedAdmin();
  const port = Number(process.env.PORT) || 3002;
  const server = app.listen(port, () => console.log(`API running on :${port}`));
  server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the existing backend or set a different PORT in backend/.env.`);
    } else {
      console.error(`API failed to listen on port ${port}: ${error.message}`);
    }
    process.exit(1);
  });
}).catch(e => { console.error(e); process.exit(1); });
