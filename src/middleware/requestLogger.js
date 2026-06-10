import { db, schema } from '../db/index.js';

// req.query/req.headers can be null-prototype objects, and req.body is
// undefined for bodyless requests - normalize all to plain JSON for jsonb columns.
function toPlainJson(value) {
  if (value === undefined) return {};
  return JSON.parse(JSON.stringify(value));
}

// Logs every request from the driver app (method, path, query, headers, body)
// so that calls are captured even if no specific route handles them.
// Admin UI traffic and static assets are excluded to keep this signal-only.
export async function requestLogger(req, res, next) {
  if (!(req.path.startsWith('/driver') || req.path.startsWith('/control-tower'))) {
    return next();
  }

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  try {
    await db.insert(schema.requestLog).values({
      method: req.method,
      path: req.path,
      query: toPlainJson(req.query),
      headers: toPlainJson(req.headers),
      body: toPlainJson(req.body),
      ip: req.ip,
    });
  } catch (err) {
    console.error('requestLogger: failed to persist request log:', err.message);
  }
  next();
}
