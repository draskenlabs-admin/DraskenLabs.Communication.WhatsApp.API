# Phase 4 – WABA & Phone Numbers: Definition

## Purpose

Implements WhatsApp Business Account (WABA) and phone number management. This phase provides endpoints to list, retrieve, and sync WABA records from Meta's Graph API into the local database, and similarly for phone numbers associated with each WABA. It bridges the Meta platform data model with the application's persistent storage.

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| List user's WABAs from DB | ✅ Yes | — |
| Fetch WABA details from Meta | ✅ Yes | — |
| Sync WABA from Meta to DB | ✅ Yes | — |
| List phone numbers for WABA from DB | ✅ Yes | — |
| Sync phone numbers from Meta to DB | ✅ Yes | — |
| Sending messages via phone numbers | ❌ No | Future phase |
| Template management | ❌ No | Future phase |
| Webhook subscription | ❌ No | Future phase |
| Phone number registration/deregistration | ❌ No | Future phase |

---

## Modules Introduced

| Module | Role |
|--------|------|
| `WabaModule` | WABA list, detail retrieval, and DB sync |
| `WabaPhoneNumberModule` | Phone number list and sync from Meta |

---

## Data Model

### WABA (`Waba` table)

| Field | Source | Notes |
|-------|--------|-------|
| `wabaId` | Meta Graph API | Unique Meta WABA identifier |
| `name` | Meta Graph API | Business account display name |
| `currency` | Meta Graph API | Billing currency |
| `timezoneId` | Meta Graph API | Timezone code |
| `messageTemplateNamespace` | Meta Graph API | Template namespace for this WABA |
| `userId` | Application | FK to authenticated user |

### WABA Phone Number (`WabaPhoneNumber` table)

| Field | Source | Notes |
|-------|--------|-------|
| `phoneNumberId` | Meta Graph API | Unique Meta phone number ID |
| `verifiedName` | Meta Graph API | Verified business name for this number |
| `displayPhoneNumber` | Meta Graph API | E.164 formatted display number |
| `codeVerificationStatus` | Meta Graph API | Verification state |
| `qualityRating` | Meta Graph API | Message quality tier |
| `platformType` | Meta Graph API | Platform (CLOUD_API, etc.) |
| `throughputLevel` | Meta Graph API | Messaging throughput tier |
| `lastOnboardedTime` | Meta Graph API | ISO timestamp of last onboarding |
| `wabaId` | Application | FK to `Waba` |

---

## Meta API Integration

| Operation | Meta Endpoint | Notes |
|-----------|--------------|-------|
| Get WABA details | `GET /{wabaId}` | Fields: id, name, currency, timezone_id, message_template_namespace |
| Get phone numbers | `GET /{wabaId}/phone_numbers` | Fields: id, verified_name, display_phone_number, quality_rating, etc. |

---

## Sync Strategy

| Resource | Strategy | Conflict Resolution |
|----------|----------|---------------------|
| WABA | Upsert by `wabaId` | Meta is source of truth |
| Phone Number | Upsert by `phoneNumberId` | Meta is source of truth |
