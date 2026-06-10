import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { driverRouter } from './routes/driver.js';
import { adminRouter } from './routes/admin.js';
import { requestLogger } from './middleware/requestLogger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Capture every request the driver app makes, regardless of whether a
// specific route below handles it.
app.use(requestLogger);

app.use(driverRouter);
app.use('/admin/api', adminRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Anything under /driver or /control-tower that isn't explicitly handled
// still gets a 200 so the mobile app's sync queue doesn't pile up forever.
app.use((req, res) => {
  if (req.path.startsWith('/driver') || req.path.startsWith('/control-tower')) {
    return res.json({ status: 'ok', note: 'unhandled endpoint, logged only' });
  }
  res.status(404).json({ message: 'not found' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`driver-api listening on http://0.0.0.0:${port}`);
});
