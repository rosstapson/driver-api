import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db, schema } from '../db/index.js';
import { orderValuesFromBody, serializeOrder } from './driver.js';

export const adminRouter = Router();

// ---- Orders CRUD -----------------------------------------------------------

adminRouter.get('/orders', async (req, res) => {
  const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  res.json(rows.map(serializeOrder));
});

adminRouter.post('/orders', async (req, res) => {
  const body = req.body ?? {};
  const id = body.id?.trim() || `ORD-${randomUUID().slice(0, 8).toUpperCase()}`;
  const values = orderValuesFromBody(body);

  const [row] = await db
    .insert(schema.orders)
    .values({
      id,
      title: values.title ?? 'Untitled order',
      pickupAddress: values.pickupAddress ?? '',
      deliveryAddress: values.deliveryAddress ?? '',
      pickupLat: values.pickupLat ?? 0,
      pickupLng: values.pickupLng ?? 0,
      deliveryLat: values.deliveryLat ?? 0,
      deliveryLng: values.deliveryLng ?? 0,
      ...values,
    })
    .returning();

  res.status(201).json(serializeOrder(row));
});

adminRouter.put('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const values = orderValuesFromBody(req.body ?? {});

  const [row] = await db
    .update(schema.orders)
    .set(values)
    .where(eq(schema.orders.id, id))
    .returning();

  if (!row) return res.status(404).json({ message: 'order not found' });
  res.json(serializeOrder(row));
});

adminRouter.delete('/orders/:id', async (req, res) => {
  const { id } = req.params;
  await db.delete(schema.orders).where(eq(schema.orders.id, id));
  res.status(204).end();
});

// ---- Read-only event log views ---------------------------------------------

function parseLimit(req, fallback = 100) {
  const limit = Number(req.query.limit);
  return Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : fallback;
}

adminRouter.get('/logs', async (req, res) => {
  const rows = await db
    .select()
    .from(schema.requestLog)
    .orderBy(desc(schema.requestLog.id))
    .limit(parseLimit(req));
  res.json(rows);
});

adminRouter.get('/safety-events', async (req, res) => {
  const rows = await db
    .select()
    .from(schema.safetyEvents)
    .orderBy(desc(schema.safetyEvents.receivedAt))
    .limit(parseLimit(req));
  res.json(rows);
});

adminRouter.get('/gps-events', async (req, res) => {
  const rows = await db
    .select()
    .from(schema.gpsEvents)
    .orderBy(desc(schema.gpsEvents.id))
    .limit(parseLimit(req));
  res.json(rows);
});

adminRouter.get('/sos-events', async (req, res) => {
  const rows = await db
    .select()
    .from(schema.sosEvents)
    .orderBy(desc(schema.sosEvents.receivedAt))
    .limit(parseLimit(req));
  res.json(rows);
});

adminRouter.get('/messages', async (req, res) => {
  const rows = await db
    .select()
    .from(schema.messages)
    .orderBy(desc(schema.messages.id))
    .limit(parseLimit(req));
  res.json(rows);
});

adminRouter.get('/documents', async (req, res) => {
  const rows = await db
    .select()
    .from(schema.documents)
    .orderBy(desc(schema.documents.id))
    .limit(parseLimit(req));
  res.json(rows);
});
