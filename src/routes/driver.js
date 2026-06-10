import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

export const driverRouter = Router();

const ORDER_DATE_FIELDS = [
  'createdAt',
  'assignedAt',
  'completedAt',
  'navigationStartedAt',
  'navigationEndedAt',
];

const ORDER_FIELDS = [
  'title',
  'pickupAddress',
  'deliveryAddress',
  'pickupLat',
  'pickupLng',
  'deliveryLat',
  'deliveryLng',
  'distanceKm',
  'status',
  'priority',
  'estimatedMinutes',
  'itemCount',
  'routePolyline',
  'actualDistanceMeters',
  'actualDurationSeconds',
  'turnByTurnDirections',
  'safetyScore',
  'safetyEvents',
  'averageAttention',
  'eventBreakdown',
  ...ORDER_DATE_FIELDS,
];

export function orderValuesFromBody(body) {
  const values = {};
  for (const field of ORDER_FIELDS) {
    if (body[field] === undefined) continue;
    values[field] = ORDER_DATE_FIELDS.includes(field) && body[field]
      ? new Date(body[field])
      : body[field];
  }
  return values;
}

export function serializeOrder(row) {
  return {
    id: row.id,
    title: row.title,
    pickupAddress: row.pickupAddress,
    deliveryAddress: row.deliveryAddress,
    pickupLat: row.pickupLat,
    pickupLng: row.pickupLng,
    deliveryLat: row.deliveryLat,
    deliveryLng: row.deliveryLng,
    distanceKm: row.distanceKm,
    status: row.status,
    createdAt: row.createdAt?.toISOString() ?? null,
    assignedAt: row.assignedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    priority: row.priority,
    estimatedMinutes: row.estimatedMinutes,
    itemCount: row.itemCount,
    routePolyline: row.routePolyline,
    actualDistanceMeters: row.actualDistanceMeters,
    actualDurationSeconds: row.actualDurationSeconds,
    turnByTurnDirections: row.turnByTurnDirections,
    navigationStartedAt: row.navigationStartedAt?.toISOString() ?? null,
    navigationEndedAt: row.navigationEndedAt?.toISOString() ?? null,
    safetyScore: row.safetyScore,
    safetyEvents: row.safetyEvents,
    averageAttention: row.averageAttention,
    eventBreakdown: row.eventBreakdown,
  };
}

// ---- Auth / driver profile -------------------------------------------------

driverRouter.get('/driver/auth/me', (req, res) => {
  res.json({
    id: 'DRV001',
    name: 'Test Driver',
    driverId: 'DRV001',
    tenantId: 'demo-tenant',
    companyId: 'demo-company',
  });
});

driverRouter.get('/driver/profile', (req, res) => {
  res.json({
    id: 'DRV001',
    name: 'Test Driver',
    licenseNumber: 'TEST-0000',
    vehicleId: 'VEH001',
    trailerId: 'TRL001',
    tenantId: 'demo-tenant',
    companyId: 'demo-company',
  });
});

driverRouter.get('/driver/assignments', async (req, res) => {
  const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  res.json({ orders: rows.map(serializeOrder) });
});

// ---- Orders ------------------------------------------------------------------

driverRouter.get('/driver/orders/assigned', async (req, res) => {
  const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  res.json({ orders: rows.map(serializeOrder) });
});

driverRouter.put('/driver/orders/:id', async (req, res) => {
  const { id } = req.params;
  const values = orderValuesFromBody(req.body ?? {});

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
    .onConflictDoUpdate({ target: schema.orders.id, set: values })
    .returning();

  res.json(serializeOrder(row));
});

driverRouter.post('/driver/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body ?? {};
  if (!status) return res.status(400).json({ message: 'status is required' });

  const [row] = await db
    .update(schema.orders)
    .set({ status })
    .where(eq(schema.orders.id, id))
    .returning();

  if (!row) return res.status(404).json({ message: 'order not found' });
  res.json(serializeOrder(row));
});

// ---- Trips ---------------------------------------------------------------

driverRouter.post('/driver/trips/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body ?? {};
  if (status) {
    await db.update(schema.orders).set({ status }).where(eq(schema.orders.id, id));
  }
  res.json({ status: 'ok' });
});

driverRouter.post('/driver/trips/status', (req, res) => {
  res.json({ status: 'ok' });
});

// ---- Safety / GPS events ---------------------------------------------------

driverRouter.post('/driver/events/safety', async (req, res) => {
  const body = req.body ?? {};
  const payload = body.payload ?? {};
  await db
    .insert(schema.safetyEvents)
    .values({
      id: body.id,
      type: body.type ?? 'unknown',
      severity: body.severity ?? 0,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      orderId: payload.orderId ?? null,
      sessionId: payload.sessionId ?? null,
      driverId: payload.driverId ?? null,
      payload,
    })
    .onConflictDoNothing();
  res.json({ status: 'ok' });
});

driverRouter.post('/driver/events/gps', async (req, res) => {
  const body = req.body ?? {};
  await db.insert(schema.gpsEvents).values({
    driverId: body.driverId ?? null,
    tenantId: body.tenantId ?? null,
    orderId: body.orderId ?? null,
    orderCode: body.orderCode ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    speedKmh: body.speedKmh ?? null,
    heading: body.heading ?? null,
    accuracyM: body.accuracyM ?? null,
    timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
  });
  res.json({ status: 'ok' });
});

driverRouter.post('/driver/events/external-dashcam', (req, res) => {
  res.json({ status: 'ok' });
});

// ---- Emergency SOS / accident confirmation ---------------------------------

driverRouter.post('/driver/emergency/sos', async (req, res) => {
  const body = req.body ?? {};
  await db
    .insert(schema.sosEvents)
    .values({
      id: body.id,
      reason: body.reason ?? null,
      sessionId: body.sessionId ?? null,
      orderId: body.orderId ?? null,
      driverId: body.driverId ?? null,
      tenantId: body.tenantId ?? null,
      companyId: body.companyId ?? null,
      vehicleId: body.vehicleId ?? null,
      trailerId: body.trailerId ?? null,
      status: body.status ?? 'open',
      priority: body.priority ?? 'critical',
      location: body.location ?? null,
      extra: body.extra ?? {},
      capturedAt: body.capturedAt ? new Date(body.capturedAt) : new Date(),
    })
    .onConflictDoNothing();
  res.json({ status: 'ok' });
});

driverRouter.post('/driver/events/accident-confirmation', async (req, res) => {
  const body = req.body ?? {};
  await db.insert(schema.accidentConfirmations).values({
    eventId: body.eventId ?? null,
    driverOk: body.driverOk ?? null,
    sessionId: body.sessionId ?? null,
    orderId: body.orderId ?? null,
    driverId: body.driverId ?? null,
    tenantId: body.tenantId ?? null,
    vehicleId: body.vehicleId ?? null,
    location: body.location ?? null,
    note: body.note ?? null,
    confirmedAt: body.confirmedAt ? new Date(body.confirmedAt) : new Date(),
  });
  res.json({ status: 'ok' });
});

// ---- Messaging ---------------------------------------------------------------

driverRouter.get('/driver/orders/:orderId/messages', async (req, res) => {
  const { orderId } = req.params;
  const rows = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.orderId, orderId))
    .orderBy(schema.messages.createdAt);

  res.json({
    messages: rows.map((row) => ({
      sender: row.sender,
      text: row.text,
      time: row.createdAt.toISOString(),
    })),
  });
});

driverRouter.post('/driver/orders/:orderId/messages', async (req, res) => {
  const { orderId } = req.params;
  const body = req.body ?? {};
  await db.insert(schema.messages).values({
    orderId,
    sender: 'Driver',
    text: body.text ?? '',
    imagePath: body.imagePath ?? null,
    createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
  });
  res.json({ status: 'ok' });
});

// ---- Documents / POD / expenses ------------------------------------------

driverRouter.post('/driver/documents', async (req, res) => {
  await db.insert(schema.documents).values({ kind: 'document', payload: req.body ?? {} });
  res.json({ status: 'ok' });
});

driverRouter.post('/driver/pod', async (req, res) => {
  await db.insert(schema.documents).values({ kind: 'pod', payload: req.body ?? {} });
  res.json({ status: 'ok' });
});

driverRouter.post('/driver/expenses', async (req, res) => {
  await db.insert(schema.documents).values({ kind: 'expense', payload: req.body ?? {} });
  res.json({ status: 'ok' });
});

driverRouter.post('/driver/evidence/ready', async (req, res) => {
  await db.insert(schema.documents).values({ kind: 'evidence_manifest', payload: req.body ?? {} });
  res.json({ status: 'ok' });
});

// ---- Device health / control tower -----------------------------------------

driverRouter.post('/driver/device/health', (req, res) => {
  res.json({ status: 'ok' });
});

driverRouter.post('/control-tower/alerts/critical', (req, res) => {
  res.json({ status: 'ok' });
});
