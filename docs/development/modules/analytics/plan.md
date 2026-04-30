# Module: Analytics – Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| AN.1 | Query Layer | Build aggregation queries for message stats | SQL/Prisma aggregations |
| AN.2 | Overview Endpoint | Summary metrics for account dashboard | `GET /analytics/overview` |
| AN.3 | Message Analytics | Delivery, read, failure stats with time grouping | `GET /analytics/messages` |
| AN.4 | Template Analytics | Template send/delivery rates | `GET /analytics/templates` |
| AN.5 | Contact Analytics | Contact growth and opt-out trends | `GET /analytics/contacts` |
| AN.6 | Phone Number Analytics | Per-number delivery stats | `GET /analytics/phone-numbers` |
| AN.7 | Export | CSV and JSON export of metrics | `GET /analytics/export` |
| AN.8 | Performance Optimization | Materialized views or summary tables for scale | Optimized queries |

---

## Wave Detail

### Wave AN.1 – Query Layer

| Task | Notes |
|------|-------|
| Message count by status | `GROUP BY status` with date filter |
| Message count by day/week/month | `DATE_TRUNC` grouping |
| Delivery rate calculation | `SUM(status = delivered) / SUM(*)` |
| Opt-out count and rate | `COUNT(isOptedOut = true)` |
| All queries scoped to `userId` | Authorization by user ownership |

### Wave AN.2 – Overview Endpoint

| Task | Notes |
|------|-------|
| `GET /analytics/overview` | Return aggregated summary |
| Fields: total messages sent, delivery rate, read rate, opt-out rate | Last 30 days default |
| Fields: active contacts, templates approved/pending | Counts from DB |
| Cache response | 5-minute TTL in Redis |

### Wave AN.3 – Message Analytics

| Task | Notes |
|------|-------|
| `GET /analytics/messages` | Accept `from`, `to`, `groupBy`, `wabaId`, `phoneNumberId` |
| Time-series: count per `groupBy` period | `sent`, `delivered`, `read`, `failed` per period |
| Return as array of `{ date, sent, delivered, read, failed }` | — |

### Wave AN.4 – Template Analytics

| Task | Notes |
|------|-------|
| `GET /analytics/templates` | Per-template send and delivery counts |
| Join `Message` (type=template) with `MessageTemplate` | Match on template name |
| Return top templates by usage | Sort by sent count |

### Wave AN.5 – Contact Analytics

| Task | Notes |
|------|-------|
| `GET /analytics/contacts` | New contacts per period, opt-out rate |
| Time-series contact growth | `createdAt` grouped by `groupBy` |
| Opt-out trend | `isOptedOut` status changes over time |

### Wave AN.6 – Phone Number Analytics

| Task | Notes |
|------|-------|
| `GET /analytics/phone-numbers` | Per phone number: sent, delivered, read, failed |
| Group by `phoneNumberId` | Join with `WabaPhoneNumber` for display name |

### Wave AN.7 – Export

| Task | Notes |
|------|-------|
| `GET /analytics/export?format=csv` | Return CSV stream |
| `GET /analytics/export?format=json` | Return JSON file download |
| Apply same filters as other analytics endpoints | Date range, wabaId, phoneNumberId |

### Wave AN.8 – Performance Optimization

| Task | Notes |
|------|-------|
| Add DB indexes on `Message.createdAt`, `Message.status` | Speed up time-range queries |
| Evaluate materialized views | At >100k messages/day |
| Cache expensive queries in Redis | 5-minute TTL |

---

## Dependencies

| Dependency | Reason |
|-----------|--------|
| `Message` table | Core message status data |
| `InboundMessage` table | Inbound volume |
| `Contact` table | Opt-out and growth data |
| `MessageTemplate` table | Template performance |
| `WabaPhoneNumber` table | Phone number labels |
| Messaging module | Must be built first |
| Contacts module | Must be built first |
