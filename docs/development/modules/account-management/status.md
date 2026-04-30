# Module: Account Management – Status

## Summary

| Field | Value |
|-------|-------|
| Status | 🔄 In Progress |
| Completion | 70% |
| Blocking Issues | None |
| Last Updated | 2026-05-01 |

---

## Wave Status

| Wave | Name | Status | Notes |
|------|------|--------|-------|
| AM.1 | OAuth Connect Flow | ✅ Complete | All connect endpoints live |
| AM.2 | WABA Listing | ✅ Complete | `GET /wabas` live |
| AM.3 | WABA Detail & Sync | ✅ Complete | Both endpoints live |
| AM.4 | Phone Number Listing | ✅ Complete | `GET /wabas/:wabaId/phone-numbers` live |
| AM.5 | Phone Number Sync | ✅ Complete | `POST /wabas/:wabaId/phone-numbers/sync` live |
| AM.6 | WABA Disconnect | ❌ Not Started | No disconnect endpoint |
| AM.7 | Phone Number Registration | ❌ Not Started | Meta registration API not integrated |

---

## Endpoint Status

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| POST | `/connect` | JWT | ✅ Live |
| GET | `/connect/businesses` | No | ✅ Live |
| GET | `/connect/:businessId/ownedWABAs` | No | ✅ Live |
| GET | `/connect/:businessId/clientWABAs` | No | ✅ Live |
| POST | `/connect/debugToken` | No | ✅ Live |
| GET | `/wabas` | JWT | ✅ Live |
| GET | `/wabas/:wabaId` | JWT | ✅ Live |
| POST | `/wabas/:wabaId/sync` | JWT | ✅ Live |
| GET | `/wabas/:wabaId/phone-numbers` | JWT | ✅ Live |
| POST | `/wabas/:wabaId/phone-numbers/sync` | JWT | ✅ Live |
| DELETE | `/wabas/:wabaId/connect` | JWT | ❌ Not built |
| POST | `/wabas/:wabaId/phone-numbers/:id/register` | JWT | ❌ Not built |
| DELETE | `/wabas/:wabaId/phone-numbers/:id/register` | JWT | ❌ Not built |

---

## Test Coverage

| Component | Test File | Status |
|-----------|-----------|--------|
| `ConnectService` | `connect.service.spec.ts` | ✅ Exists |
| `ConnectController` | `connect.controller.spec.ts` | ✅ Exists |
| `WabaService` | — | ❌ Missing |
| `WabaController` | — | ❌ Missing |
| `WabaPhoneNumberService` | — | ❌ Missing |

---

## Issues & Risks

| Issue | Severity | Resolution |
|-------|----------|-----------|
| No WABA disconnect endpoint | High | Build Wave AM.6 |
| No phone number registration/deregistration | Medium | Build Wave AM.7 |
| No ownership check before phone number sync | Medium | Verify `wabaId` belongs to user |
| No retry on stale/revoked Meta access tokens | Medium | Add token refresh or error handling |
