import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import seedAdmin from './utils/seedAdmin.js';

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
