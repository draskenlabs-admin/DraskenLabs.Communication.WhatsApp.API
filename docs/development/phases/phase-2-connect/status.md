# Phase 2 – WhatsApp OAuth Connect: Status

## Summary

| Field | Value |
|-------|-------|
| Status | ✅ Complete (redesigned) |
| Completion | 100% |
| Blocking Issues | None |
| Last Updated | 2026-05-01 |

---

## Connect Pattern

**Meta Embedded Signup (Option A)** — the frontend runs Meta's Embedded Signup widget which handles business/WABA selection. The frontend receives `code`, `wabaId`, and `businessId` and posts them to `POST /connect`. The backend handles everything server-side from there.

---

## Wave Completion

| Wave | Name | Status | Notes |
|------|------|--------|-------|
| 2.1 | DTOs & Interfaces | ✅ Complete | Simplified — no phoneNumberId in connect request |
| 2.2 | Redis State Management | ✅ Removed | State-based OAuth pattern removed — not needed for Embedded Signup |
| 2.3 | Meta Token Exchange | ✅ Complete | Code → access token exchange via Meta Graph API |
| 2.4 | WABA Metadata Sync | ✅ Complete | Name, currency, timezone, template namespace fetched on connect |
| 2.5 | Phone Number Auto-Sync | ✅ Complete | Phone numbers fetched from Meta and upserted to DB on connect |
| 2.6 | Redis Phone Cache Population | ✅ Complete | `phone:{phoneNumberId}` keys populated on connect (gap F3 resolved) |
| 2.7 | User-Scoped API Key Design | ✅ Complete | API keys are user-scoped; phone binding happens at message time via phone cache |

---

## Deliverable Status

| Deliverable | Status | Location |
|-------------|--------|----------|
| `ConnectController` | ✅ Done | `src/connect/connect.controller.ts` |
| `ConnectService` | ✅ Done | `src/connect/connect.service.ts` |
| `ConnectModule` | ✅ Done | `src/connect/connect.module.ts` |
| `ConnectWhatsAppRequestDTO` | ✅ Done | `src/connect/dto/connect-waba.dto.ts` |
| `ConnectWhatsAppResponseDTO` | ✅ Done | `src/connect/dto/connect-waba.dto.ts` |
| `ConnectedPhoneNumberDTO` | ✅ Done | `src/connect/dto/connect-waba.dto.ts` |

---

## Endpoint Status

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| POST | `/connect` | JWT | ✅ Live |

### Removed endpoints
| Method | Endpoint | Reason |
|--------|----------|--------|
| GET | `/connect/businesses` | Embedded Signup handles business selection on frontend |
| GET | `/connect/:businessId/ownedWABAs` | Embedded Signup handles WABA selection on frontend |
| GET | `/connect/:businessId/clientWABAs` | Same — also had missing auth (gap C3, now moot) |
| POST | `/connect/debugToken` | Unused utility endpoint |

---

## POST /connect Flow

```
Client sends: { code, wabaId, businessId }
  ↓
1. Exchange code → rawAccessToken (Meta Graph API)
2. Fetch WABA metadata (name, currency, timezone, template namespace)
3. Upsert Waba record in DB
4. Encrypt rawAccessToken → store in UserWhatsapp (userId, businessId, wabaId)
5. Fetch phone numbers for WABA from Meta
6. Upsert WabaPhoneNumber records in DB
7. Populate Redis: phone:{phoneNumberId} → { userId, wabaId, encryptedToken }
8. Return: { wabaId, businessId, phoneNumbers: [...] }
```

The raw access token never leaves the server.

---

## Schema Changes (from original design)

| Model | Change |
|-------|--------|
| `UserWhatsapp` | Removed `phoneNumberId` field — phones managed separately in `WabaPhoneNumber` |
| `UserWhatsapp` | Unique key changed from `(userId, businessId)` to `(userId, wabaId)` |

---

## Test Coverage

| File | Test File | Status |
|------|-----------|--------|
| `connect.service.ts` | `connect.service.spec.ts` | ⚠️ Exists but needs rewrite for new flow |
| `connect.controller.ts` | `connect.controller.spec.ts` | ⚠️ Exists but needs rewrite |

---

## Issues & Risks

| Issue | Severity | Resolution |
|-------|----------|-----------|
| No retry on Meta API failures | Medium | Add retry logic for transient Meta API errors |
| Spec files not updated for new flow | Medium | Rewrite in Phase 6 testing wave |
