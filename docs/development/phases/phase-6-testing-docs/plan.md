# Phase 6 – Testing & Documentation: Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| 6.1 | Foundation Tests | Unit tests for Prisma, Redis, EncryptionService | 3 spec files |
| 6.2 | Auth & User Tests | Unit tests for AuthMiddleware, UserService, UserWhatsappService | 3 spec files |
| 6.3 | Connect Tests | Unit tests for ConnectService and ConnectController | 2 spec files |
| 6.4 | WABA Tests | Unit tests for WabaService, WabaController, WabaPhoneNumberService | 3 spec files |
| 6.5 | API Key Tests | Unit tests for ApiKeyService and ApiKeyController | 2 spec files |
| 6.6 | E2E Tests | Full HTTP flow tests for all endpoint groups | E2E spec suite |
| 6.7 | Documentation | Swagger annotations review, developer docs, this docs structure | Complete docs |

---

## Wave Detail

### Wave 6.1 – Foundation Tests

| Test File | What to Test |
|-----------|-------------|
| `prisma.service.spec.ts` | Connection lifecycle, `onModuleInit`, `onModuleDestroy` |
| `redis.service.spec.ts` | `get`, `set`, `del`, `expire` — mock ioredis |
| `crypto.service.spec.ts` | `encrypt` → `decrypt` round-trip, invalid ciphertext rejection |

### Wave 6.2 – Auth & User Tests

| Test File | What to Test |
|-----------|-------------|
| `auth.middleware.spec.ts` | Valid JWT, expired JWT, missing header, unknown clerkId |
| `user.service.spec.ts` | `findById`, `findByClerkId`, `findByEmail` — not found cases |
| `user-whatsapp.service.spec.ts` | Upsert, token encryption on write, decryption on read |

### Wave 6.3 – Connect Tests

| Test File | What to Test |
|-----------|-------------|
| `connect.service.spec.ts` | Token exchange, Redis state CRUD, Meta API mocks |
| `connect.controller.spec.ts` | Route binding, response format, auth guard behaviour |

### Wave 6.4 – WABA Tests

| Test File | What to Test |
|-----------|-------------|
| `waba.service.spec.ts` | List, fetch from Meta (mocked axios), upsert logic |
| `waba.controller.spec.ts` | Route binding, response shapes |
| `waba-phone-number.service.spec.ts` | List, sync from Meta (mocked), upsert |

### Wave 6.5 – API Key Tests

| Test File | What to Test |
|-----------|-------------|
| `api-key.service.spec.ts` | Key generation, encryption, Redis cache write, listing |
| `api-key.controller.spec.ts` | Route binding, creation response includes secret once |

### Wave 6.6 – E2E Tests

| Test Scenario | Endpoint Group |
|---------------|---------------|
| Root info endpoint | `GET /` |
| User profile flow | `GET /user/profile` with valid/invalid token |
| OAuth connect flow | `POST /connect` end-to-end |
| WABA list and sync | `GET /wabas`, `POST /wabas/:id/sync` |
| Phone number sync | `POST /wabas/:id/phone-numbers/sync` |
| API key create and list | `POST /api-keys`, `GET /api-keys` |

### Wave 6.7 – Documentation

| Task | Notes |
|------|-------|
| Audit all `@ApiProperty()` decorators | Ensure all DTO fields documented |
| Add response example annotations | Use `@ApiResponse` with `example` |
| Complete this docs structure | All phase and module docs |
| Write `README.md` | Setup, run, test, env vars |
