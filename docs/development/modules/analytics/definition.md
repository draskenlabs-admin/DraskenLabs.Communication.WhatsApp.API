# Module: Analytics – Definition

## Purpose

Provides reporting and metrics on messaging activity, template performance, and account health. Aggregates data from the Messaging, Templates, Contacts, and Webhooks modules to surface actionable insights — delivery rates, read rates, opt-out rates, template performance, and usage summaries — for both platform users and internal monitoring.

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| Message delivery and read rate metrics | ✅ Yes | — |
| Template performance metrics | ✅ Yes | — |
| Opt-out rate and trends | ✅ Yes | — |
| Usage summaries (messages sent per day/week/month) | ✅ Yes | — |
| WABA and phone number health metrics | ✅ Yes | — |
| Contact growth metrics | ✅ Yes | — |
| Export to CSV/JSON | ✅ Yes | — |
| Real-time dashboards | ❌ No | Future (WebSocket push) |
| Predictive analytics or ML | ❌ No | Future |
| External BI tool integration (Metabase, Looker) | ❌ No | Future |
| Meta's own analytics (conversation-based pricing) | ❌ No | Surfaced separately |

---

## Metric Definitions

| Metric | Formula | Notes |
|--------|---------|-------|
| Delivery Rate | `delivered / sent * 100` | Per phone number or WABA |
| Read Rate | `read / delivered * 100` | Per phone number or WABA |
| Failure Rate | `failed / sent * 100` | Per phone number or WABA |
| Opt-Out Rate | `opted_out / total_contacts * 100` | Per user account |
| Template CTR | `button_clicks / delivered * 100` | Requires interactive tracking |
| Messages per Day | `COUNT(messages) GROUP BY day` | Time-series |

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/overview` | JWT / API Key | Summary metrics for the account |
| GET | `/analytics/messages` | JWT / API Key | Message delivery stats with date range |
| GET | `/analytics/templates` | JWT / API Key | Template performance metrics |
| GET | `/analytics/contacts` | JWT / API Key | Contact and opt-out growth |
| GET | `/analytics/phone-numbers` | JWT / API Key | Per-phone-number delivery stats |
| GET | `/analytics/export` | JWT | Export metrics as CSV or JSON |

---

## Query Parameters (Common)

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | ISO date | Start of date range |
| `to` | ISO date | End of date range |
| `wabaId` | string | Filter by WABA |
| `phoneNumberId` | string | Filter by phone number |
| `groupBy` | enum | `day`, `week`, `month` |

---

## Data Sources

| Source | Data Used |
|--------|----------|
| `Message` table | Sent count, status distribution |
| `InboundMessage` table | Inbound volume |
| `Contact` table | Total contacts, opt-out count |
| `MessageTemplate` table | Template usage, approval rates |
| `WabaPhoneNumber` table | Quality rating history |

---

## Aggregation Strategy

| Approach | Notes |
|----------|-------|
| On-demand SQL aggregation | Simple for MVP — acceptable at low volume |
| Materialized views | Recommended for high-volume production |
| Separate analytics tables | Optional — pre-aggregated daily summaries |
