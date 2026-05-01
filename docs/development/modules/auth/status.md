# Module: Auth – Status

## Summary

| Field | Value |
|-------|-------|
| Status | 🔄 In Progress |
| Completion | 90% |
| Blocking Issues | None |
| Last Updated | 2026-05-01 |

---

## Wave Status

| Wave | Name | Status | Notes |
|------|------|--------|-------|
| A.0 | Clerk Signup | ✅ Complete | `POST /auth/signup` — creates user in Clerk + DB, returns JWT |
| A.0b | Clerk Login | ✅ Complete | `POST /auth/login` — verifies via Clerk FAPI, auto-provisions DB user, returns JWT |
| A.1 | JWT Auth Middleware | ✅ Complete | `AuthMiddleware` with Redis user cache (15 min TTL, zero DB hit on cache hit) |
| A.2 | User Profile Endpoint | ✅ Complete | `GET /user/profile` live |
| A.3 | API Key Generation | ✅ Complete | `POST /api-keys` live |
| A.4 | API Key Listing | ✅ Complete | `GET /api-keys` live |
| A.5 | API Key Auth Strategy | ❌ Not Started | Guard/middleware not implemented |
| A.6 | API Key Revocation | ❌ Not Started | `DELETE /api-keys/:id` missing |
| A.7 | User Status Guard | ✅ Complete | `user.status` check added to `AuthMiddleware` |

---

## Endpoint Status

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| POST | `/auth/signup` | No | ✅ Live |
| POST | `/auth/login` | No | ✅ Live |
| POST | `/user/test-token` | No | ✅ Live (Dev only — needs prod gate) |
| GET | `/user/profile` | JWT | ✅ Live |
| POST | `/api-keys` | JWT | ✅ Live |
| GET | `/api-keys` | JWT | ✅ Live |
| DELETE | `/api-keys/:id` | JWT | ❌ Not built |

---

## Auth Middleware — Cache Behaviour

| Scenario | DB Hit | Source |
|----------|--------|--------|
| First request after login | Yes (cache miss) | DB → writes to Redis |
| Subsequent requests (within 15 min) | No | Redis cache |
| After `invalidateUserCache()` call | Yes (cache cleared) | DB → writes to Redis |

---

## Test Coverage

| Component | Test File | Status |
|-----------|-----------|--------|
| `AuthMiddleware` | — | ❌ Missing |
| `AuthService` | — | ❌ Missing |
| `ClerkService` | — | ❌ Missing |
| `UserService` | — | ❌ Missing |
| `ApiKeyService` | — | ❌ Missing |
| `ApiKeyController` | — | ❌ Missing |

---

## Issues & Risks

| Issue | Severity | Resolution |
|-------|----------|-----------|
| API key auth strategy not implemented | High | Build Wave A.5 — API keys can be created but not used for auth |
| No API key revocation | High | Build Wave A.6 |
| Test token not gated by `NODE_ENV` | High | Add `NODE_ENV === 'production'` guard (gap F6) |
| Zero test coverage | High | Add unit tests for middleware and services |
