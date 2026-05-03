# Phase 3 – User Management & SSO Auth: Status

## Summary

| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| Completion | 100% |
| Blocking Issues | None |
| Last Updated | 2026-05-03 |

---

## Wave Completion

| Wave | Name | Status | Notes |
|------|------|--------|-------|
| 3.1 | PKCE Authorize Endpoint | ✅ Complete | `GET /auth/authorize` — Redis state, SSO redirect URL |
| 3.2 | SSO Callback & JWT Issuance | ✅ Complete | `POST /auth/callback` — code exchange, user provision, JWT signed |
| 3.3 | SsoService | ✅ Complete | `getAuthorizeUrl`, `exchangeCode`, `decodeUserInfo` — extracts ssoOrgId and role |
| 3.4 | Slim User Model | ✅ Complete | `User { id, ssoId, createdAt }` — no local profile fields |
| 3.5 | JWT Auth Middleware | ✅ Complete | Redis user cache (15 min TTL); falls through to DB on miss |
| 3.6 | User Profile Endpoint | ✅ Complete | `GET /user/profile` returns `{ id, ssoId, createdAt }` |
| 3.7 | Route Protection | ✅ Complete | `AuthMiddleware` applied across all JWT-protected routes |

---

## Deliverable Status

| Deliverable | Status | Location |
|-------------|--------|----------|
| `AuthController` | ✅ Done | `src/auth/auth.controller.ts` |
| `AuthService` | ✅ Done | `src/auth/auth.service.ts` |
| `SsoService` | ✅ Done | `src/auth/sso.service.ts` |
| `AuthModule` | ✅ Done | `src/auth/auth.module.ts` |
| `UserController` | ✅ Done | `src/user/user.controller.ts` |
| `UserService` | ✅ Done | `src/user/user.service.ts` |
| `AuthMiddleware` | ✅ Done | `src/user/middleware/auth.middleware.ts` |
| `UserModule` | ✅ Done | `src/user/user.module.ts` |
| `AuthorizeQueryDto` | ✅ Done | `src/auth/dto/authorize.dto.ts` |
| `AuthCallbackDto` | ✅ Done | `src/auth/dto/callback.dto.ts` |
| `AuthResponseDto` | ✅ Done | `src/auth/dto/auth-response.dto.ts` |

---

## Endpoint Status

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| GET | `/auth/authorize` | None | ✅ Live |
| POST | `/auth/callback` | None | ✅ Live |
| GET | `/user/profile` | JWT | ✅ Live |

---

## Multi-tenancy Model

`orgId` in the JWT payload is the SSO organisation UUID (`ssoOrgId`). Every protected controller reads `(req as any).orgId` from the request context (set by `AuthMiddleware`) to scope DB queries. No local org table is needed.

---

## Breaking Changes from Previous Implementation

| Removed | Replaced By |
|---------|------------|
| `POST /auth/signup` (Clerk) | PKCE flow via `GET /auth/authorize` + `POST /auth/callback` |
| `POST /auth/login` (Clerk) | PKCE flow |
| `ClerkService` | `SsoService` |
| `User.email`, `User.firstName`, `User.lastName`, `User.status` | Removed — profile in SSO |
| `Organisation`, `OrgMember` DB tables | `ssoOrgId: String` on all relevant models |
| `user.status` check in middleware | Removed — SSO manages account state |

---

## Test Coverage

| File | Test File | Status |
|------|-----------|--------|
| `auth.middleware.ts` | `auth.middleware.spec.ts` | ✅ 4 tests |
| `sso.service.ts` | `sso.service.spec.ts` | ✅ 7 tests |
| `auth.service.ts` | — | ❌ Missing |
| `user.service.ts` | — | ❌ Missing |
