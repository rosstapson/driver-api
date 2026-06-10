import { pgTable, text, doublePrecision, integer, boolean, timestamp, jsonb, serial } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  pickupAddress: text('pickup_address').notNull(),
  deliveryAddress: text('delivery_address').notNull(),
  pickupLat: doublePrecision('pickup_lat').notNull(),
  pickupLng: doublePrecision('pickup_lng').notNull(),
  deliveryLat: doublePrecision('delivery_lat').notNull(),
  deliveryLng: doublePrecision('delivery_lng').notNull(),
  distanceKm: doublePrecision('distance_km').notNull().default(0),
  status: text('status').notNull().default('pending'),
  priority: text('priority').notNull().default('medium'),
  estimatedMinutes: doublePrecision('estimated_minutes').notNull().default(0),
  itemCount: integer('item_count').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  navigationStartedAt: timestamp('navigation_started_at', { withTimezone: true }),
  navigationEndedAt: timestamp('navigation_ended_at', { withTimezone: true }),
  routePolyline: text('route_polyline'),
  actualDistanceMeters: doublePrecision('actual_distance_meters'),
  actualDurationSeconds: integer('actual_duration_seconds'),
  turnByTurnDirections: jsonb('turn_by_turn_directions'),
  safetyScore: doublePrecision('safety_score'),
  safetyEvents: integer('safety_events'),
  averageAttention: doublePrecision('average_attention'),
  eventBreakdown: jsonb('event_breakdown'),
});

export const safetyEvents = pgTable('safety_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  severity: integer('severity').notNull().default(0),
  timestamp: timestamp('timestamp', { withTimezone: true }),
  orderId: text('order_id'),
  sessionId: text('session_id'),
  driverId: text('driver_id'),
  payload: jsonb('payload'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});

export const gpsEvents = pgTable('gps_events', {
  id: serial('id').primaryKey(),
  driverId: text('driver_id'),
  tenantId: text('tenant_id'),
  orderId: text('order_id'),
  orderCode: text('order_code'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  speedKmh: doublePrecision('speed_kmh'),
  heading: doublePrecision('heading'),
  accuracyM: doublePrecision('accuracy_m'),
  timestamp: timestamp('timestamp', { withTimezone: true }),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sosEvents = pgTable('sos_events', {
  id: text('id').primaryKey(),
  reason: text('reason'),
  sessionId: text('session_id'),
  orderId: text('order_id'),
  driverId: text('driver_id'),
  tenantId: text('tenant_id'),
  companyId: text('company_id'),
  vehicleId: text('vehicle_id'),
  trailerId: text('trailer_id'),
  status: text('status'),
  priority: text('priority'),
  location: jsonb('location'),
  extra: jsonb('extra'),
  capturedAt: timestamp('captured_at', { withTimezone: true }),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accidentConfirmations = pgTable('accident_confirmations', {
  id: serial('id').primaryKey(),
  eventId: text('event_id'),
  driverOk: boolean('driver_ok'),
  sessionId: text('session_id'),
  orderId: text('order_id'),
  driverId: text('driver_id'),
  tenantId: text('tenant_id'),
  vehicleId: text('vehicle_id'),
  location: jsonb('location'),
  note: text('note'),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').notNull(),
  sender: text('sender').notNull().default('Office'),
  text: text('text'),
  imagePath: text('image_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  kind: text('kind').notNull(), // 'document' | 'pod' | 'expense' | 'evidence_manifest'
  payload: jsonb('payload'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});

export const requestLog = pgTable('request_log', {
  id: serial('id').primaryKey(),
  method: text('method').notNull(),
  path: text('path').notNull(),
  query: jsonb('query'),
  headers: jsonb('headers'),
  body: jsonb('body'),
  ip: text('ip'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});
