# Gap Fill Plan

Plan to resolve all 20 gaps identified in `docs/development/architecture-gap-analysis.md`.

---

## Core Design Intent: One API Key → Any Phone Number

Before reading the individual tasks, it is important to understand the single design principle that drives Waves 2, 3, and 4 together:

> **An API key is user-scoped, not phone-scoped. One key gives access to every phone number that belongs to that user, across all their WABAs. Phone number resolution happens at request time — not at key creation time.**

### How This Works End-to-End

```
Key Creation  (POST /api-keys)
─────────────────────────────
API key is created with NO phone number binding.
Redis stores only:  apiKey:{accessKey} → { userId, secretKey }
The user gets back: { accessKey, secretKey }
That's it. No phone. No WABA. No token.


Phone Cache   (POST /wabas/:wabaId/phone-numbers/sync)
──────────────────────────────────────────────────────
Separately, whenever the user syncs their phone numbers,
Redis is populated with one entry per phone number:
  phone:{phoneNumberId_1} → { userId, wabaId, accessToken }
  phone:{phoneNumberId_2} → { userId, wabaId, accessToken }
  phone:{phoneNumberId_3} → { userId, wabaId_B, accessToken }   ← different WABA, same key works
  ...


Message Send  (POST /messages)
──────────────────────────────
Client sends:  x-access-key + x-secret-key + { phoneNumberId, to, ... }

Step 1 — Resolve user:
  GET apiKey:{accessKey}  →  { userId, secretKey }
  verify secretKey → userId resolved

Step 2 — Resolve phone token:
  GET phone:{phoneNumberId}  →  { userId, wabaId, accessToken }
  assert phone.userId === apiKey.userId  →  ownership confirmed
  decrypt accessToken  →  ready to call Meta

Step 3 — Send:
  POST /{phoneNumberId}/messages  Authorization: Bearer {decryptedToken}
```

### What the Current Code Does Wrong

| Aspect | Current Code | Architecture |
|--------|-------------|-------------|
| Key creation requires | `phoneNumberId` + `wabaId` in request body | Nothing — user-scoped only |
| Key is bound to | One specific phone number at creation | No phone — any phone at send time |
| Redis stores at key creation | `secret_key` + `{phoneNumberId}: decryptedToken` in one Hash | Only `{ userId, secretKey: encrypted }` |
| Phone token lookup | Baked into API key Redis Hash | Separate `phone:{phoneNumberId}` key |
| User with 4 phone numbers needs | 4 API keys (one per phone) | 1 API key (works for all 4) |

Tasks 2.2, 3.1, 3.2, 3.3, and 4.1 together implement this design. They must be understood and delivered as a cohesive unit, not as isolated fixes.

---

## Overview

| Wave | Name | Gaps Addressed | Effort | Unblocks |
|------|------|---------------|--------|---------|
| [Wave 1](#wave-1--critical-security-hotfixes) | Critical Security Hotfixes | C1, C3, F2, F6, M6 | Low | Safe to deploy |
| [Wave 2](#wave-2--redis-redesign) | Redis Redesign | A5, A3, C2 | Medium | Waves 3, 4, 5 |
| [Wave 3](#wave-3--phone-cache-population) | Phone Cache Population | A1, A2, F3, F4 | Medium | Wave 4, Messaging module |
| [Wave 4](#wave-4--api-key-auth-middleware) | API Key Auth Middleware | A4 | Medium | Messaging, Analytics, Contacts via API key |
| [Wave 5](#wave-5--lifecycle-management) | Lifecycle Management | F1, F5 | Low–Medium | Key revocation, WABA disconnect |
| [Wave 6](#wave-6--minor-fixes) | Minor Fixes | M1, M2, M3, M4, M5 | Low | Code quality, reliability |

---

## Dependency Order

```
Wave 1  ──────────────────────────────────────────────►  Safe to ship
   │
   ▼
Wave 2 (Redis Redesign)
   │
   ├──► Wave 3 (Phone Cache) ──► Wave 4 (API Key Auth) ──► Messaging module
   │
   └──► Wave 5 (Lifecycle) ─────────────────────────────► Key revocation

Wave 6  ──── independent, can run in parallel with any wave
```

---

## Wave 1 — Critical Security Hotfixes

**Goal:** Resolve all security vulnerabilities that exist in the current code with no dependency on other waves. Each task here is a small, isolated change.

---

### Task 1.1 — Fix WABA Ownership Check in Upsert `(Gap C1)`

**File:** `src/waba/waba.service.ts`

**Problem:** `createOrUpdateWaba()` uses `where: { wabaId }` in Prisma upsert without validating that the existing record belongs to the requesting user. A different user can call `POST /wabas/:wabaId/sync` to overwrite ownership of any WABA.

**Fix:** Before executing the upsert, check if a `Waba` record with that `wabaId` already exists. If it does and its `userId` does not match the requester's `userId`, throw `ForbiddenException`.

| Step | Action |
|------|--------|
| 1 | Before `prisma.waba.upsert()`, call `prisma.waba.findUnique({ where: { wabaId } })` |
| 2 | If record exists and `record.userId !== data.userId` → throw `ForbiddenException('WABA belongs to another account')` |
| 3 | Proceed with upsert only if ownership is confirmed or record is new |

**Test cases to add:**
- User A syncs WABA they own → succeeds
- User B syncs User A's `wabaId` → `403 Forbidden`
- New `wabaId` not yet in DB → creates successfully

---

### Task 1.2 — Protect `GET /connect/:businessId/clientWABAs` `(Gap C3)`

**File:** `src/connect/connect.module.ts`

**Problem:** `AuthMiddleware` is not registered for this route. The `configure()` method is missing one entry.

**Fix:** Add the missing route to the `forRoutes()` call.

| Step | Action |
|------|--------|
| 1 | Open `ConnectModule.configure()` |
| 2 | Add `{ path: 'connect/:businessId/clientWABAs', method: RequestMethod.GET }` to `forRoutes()` |

---

### Task 1.3 — Add `user.status` Check to `AuthMiddleware` `(Gap F2)`

**File:** `src/user/middleware/auth.middleware.ts`

**Problem:** A deactivated user (`status: false`) can still authenticate and access the API.

**Fix:** After loading the user from the database, assert `user.status === true`.

| Step | Action |
|------|--------|
| 1 | After `userService.findById(payload.sub)`, check `if (!user || !user.status)` |
| 2 | Throw `UnauthorizedException('Account is deactivated')` if `status` is `false` |

---

### Task 1.4 — Gate `POST /user/test-token` Behind `NODE_ENV` `(Gap F6)`

**File:** `src/user/user.controller.ts`

**Problem:** The test token endpoint returns a signed JWT for hardcoded `userId=1` in all environments, including production.

**Fix:** Return `403 Forbidden` if `NODE_ENV === 'production'`.

| Step | Action |
|------|--------|
| 1 | Inject `ConfigService` into `UserController` |
| 2 | At the start of the handler, check `if (this.config.get('NODE_ENV') === 'production')` → throw `ForbiddenException` |

---

### Task 1.5 — Enable `forbidUnknownValues` in `ValidationPipe` `(Gap M6)`

**File:** `src/main.ts`

**Problem:** `forbidUnknownValues: false` allows unknown nested object structures through validation. Architecture intent is strict input.

**Fix:** Set `forbidUnknownValues: true`.

| Step | Action |
|------|--------|
| 1 | In `ValidationPipe` options, change `forbidUnknownValues` from `false` to `true` |
| 2 | Run existing tests to confirm no breakage |

---

## Wave 2 — Redis Redesign

**Goal:** Replace the current ad-hoc Redis structure with the schema defined in the architecture. This wave must complete before Waves 3, 4, and 5.

---

### Task 2.1 — Add Generic Operations to `RedisService` `(Gap A5)`

**File:** `src/redis/redis.service.ts`

**Problem:** `RedisService` only exposes 5 domain-specific methods. The architecture requires generic `get`, `set`, `del`, `expire`, `sadd`, `smembers` to support all cache patterns.

**Fix:** Add generic wrappers around the raw ioredis client.

| Method | Signature | Notes |
|--------|-----------|-------|
| `get` | `get(key: string): Promise<string \| null>` | Raw string get |
| `set` | `set(key: string, value: string): Promise<void>` | Persistent set |
| `setEx` | `setEx(key: string, ttl: number, value: string): Promise<void>` | Set with TTL in seconds |
| `del` | `del(key: string): Promise<void>` | Delete key |
| `expire` | `expire(key: string, ttl: number): Promise<void>` | Set TTL on existing key |
| `sadd` | `sadd(key: string, ...members: string[]): Promise<void>` | Add to Set |
| `smembers` | `smembers(key: string): Promise<string[]>` | Get all Set members |
| `srem` | `srem(key: string, ...members: string[]): Promise<void>` | Remove from Set |

Keep the existing domain methods (`getState`, `createState`, `updateState`) — they can be refactored to call the generic methods internally.

---

### Task 2.2 — Redesign API Key Redis Schema `(Gaps A3 + C2)`

**Files:** `src/redis/redis.service.ts`, `src/api-key/api-key.service.ts`

**Problem:** Two issues in one:
1. Key prefix is `access_key:{x}` (should be `apiKey:{x}`)
2. Type is Redis Hash (should be JSON String)
3. Secret key stored plaintext (must be AES-256-GCM encrypted)
4. Phone token mixed into API key hash (must be a separate key)

**New API Key Cache Contract:**

```
Key:   apiKey:{accessKey}
Type:  String (JSON)
Value: { userId: number, secretKey: string }   ← secretKey is encrypted
TTL:   None (invalidated explicitly on revoke)
```

**Fix Steps:**

| Step | Action | File |
|------|--------|------|
| 1 | Remove `setApiKey(accessKey, secretKey, phoneNumberId, accessToken)` method | `redis.service.ts` |
| 2 | Add `setApiKeyCache(accessKey: string, userId: number, encryptedSecretKey: string): Promise<void>` — calls `this.set('apiKey:' + accessKey, JSON.stringify({ userId, secretKey: encryptedSecretKey }))` | `redis.service.ts` |
| 3 | Replace `getApiKey(accessKey)` → `getApiKeyCache(accessKey): Promise<{ userId, secretKey } \| null>` — parses JSON from `apiKey:{accessKey}` | `redis.service.ts` |
| 4 | In `ApiKeyService.createApiKey()`: remove `dto.phoneNumberId` and `decryptedAccessToken` from the Redis call | `api-key.service.ts` |
| 5 | Replace Redis write with `redisService.setApiKeyCache(accessKey, userId, encryptedSecretKey)` | `api-key.service.ts` |
| 6 | Update `ApiKeyService` — the `CreateApiKeyDto` must not require `phoneNumberId` (phone resolution happens at message time, not key creation time) | `api-key/dto/api-key.dto.ts` |

---

## Wave 3 — Phone Cache Population

**Goal:** Implement the `phone:{phoneNumberId}` and `user:{userId}:phones` Redis keys that are the backbone of multi-WABA phone resolution. Depends on Wave 2 (generic Redis ops must exist first).

---

### Task 3.1 — Add Phone Cache Methods to `RedisService` `(Gaps A1, A2)`

**File:** `src/redis/redis.service.ts`

Add three dedicated phone cache methods that internally use the generic ops from Task 2.1.

| Method | Action |
|--------|--------|
| `setPhoneCache(phoneNumberId, userId, wabaId, encryptedAccessToken)` | `SET phone:{phoneNumberId}` → JSON + `SADD user:{userId}:phones {phoneNumberId}` |
| `getPhoneCache(phoneNumberId)` | `GET phone:{phoneNumberId}` → parsed JSON or null |
| `invalidateUserPhones(userId)` | `SMEMBERS user:{userId}:phones` → `DEL phone:{id}` for each → `DEL user:{userId}:phones` |

**Redis key contracts:**

```
Key:   phone:{phoneNumberId}
Type:  String (JSON)
Value: { userId: number, wabaId: string, accessToken: string }  ← accessToken encrypted
TTL:   None

Key:   user:{userId}:phones
Type:  Set
Value: [ phoneNumberId, phoneNumberId, ... ]
TTL:   None
```

---

### Task 3.2 — Populate Phone Cache After Phone Number Sync `(Gap F4)`

**File:** `src/waba-phone-number/waba-phone-number.service.ts`

**Problem:** `syncPhoneNumbers()` saves phone records to DB but never writes to Redis.

**Fix:** After the DB upsert loop, retrieve the user's encrypted access token and call `redisService.setPhoneCache()` for every synced phone number.

| Step | Action |
|------|--------|
| 1 | After DB upsert of all phone numbers, call `userWhatsappService.getEncryptedToken(userId, wabaId)` |
| 2 | For each synced phone number: call `redisService.setPhoneCache(phone.phoneNumberId, userId, wabaId, encryptedToken)` |
| 3 | The WABA's `wabaId` string is already available as the route param |

**Note:** Use `getEncryptedToken` — not the decrypted version — to keep the token encrypted in Redis (consistent with architecture).

---

### Task 3.3 — Populate Phone Cache After OAuth Connect `(Gap F3)`

**File:** `src/connect/connect.service.ts`

**Problem:** `connectWhatsapp()` saves the `UserWhatsapp` record to DB but does not write any Redis phone cache entries.

**Fix:** After saving to DB, look up the synced phone numbers for this WABA and populate the phone cache.

| Step | Action |
|------|--------|
| 1 | After `userWhatsappService.createOrUpdate()`, call `wabaPhoneNumberService.findAllByWabaId(userId, wabaId)` |
| 2 | Get encrypted token via `userWhatsappService.getEncryptedToken(userId, businessId)` |
| 3 | For each phone number found: call `redisService.setPhoneCache(phone.phoneNumberId, userId, wabaId, encryptedToken)` |
| 4 | If no phone numbers exist yet (first connect before sync), skip — cache will be populated on first sync |

---

## Wave 4 — API Key Auth Middleware

**Goal:** Build the second authentication strategy — API key validation via `x-access-key` and `x-secret-key` headers — using the Redis schema established in Wave 2. Depends on Wave 2.

---

### Task 4.1 — Create `ApiKeyMiddleware` `(Gap A4)`

**New File:** `src/auth/middleware/api-key.middleware.ts`

**Contract:**
1. Read `x-access-key` header → 401 if missing
2. `GET apiKey:{accessKey}` from Redis → 401 if not found
3. Decrypt `cachedEntry.secretKey` → compare with `x-secret-key` header → 401 if mismatch
4. Load `User` from DB by `cachedEntry.userId` → 401 if not found or `status !== true`
5. Attach `req.user = user` and `req.authType = 'apiKey'`

| Step | Action |
|------|--------|
| 1 | Create `ApiKeyMiddleware` implementing `NestMiddleware` |
| 2 | Inject `RedisService`, `UserService`, `CryptoService` |
| 3 | Implement the 5-step validation above |
| 4 | Return `UnauthorizedException` at any failure step |

---

### Task 4.2 — Create Dual-Auth Middleware `(Gap A4)`

**New File:** `src/auth/middleware/dual-auth.middleware.ts`

Routes that accept both JWT and API Key (messaging, contacts, analytics) need a middleware that tries both strategies and accepts either.

| Step | Action |
|------|--------|
| 1 | Check if `Authorization: Bearer` header is present → delegate to `AuthMiddleware` logic |
| 2 | Else check if `x-access-key` header is present → delegate to `ApiKeyMiddleware` logic |
| 3 | If neither → `401 Unauthorized` |

---

### Task 4.3 — Apply Auth Middlewares to Routes

**Files:** Module `configure()` methods for each affected module.

| Route Group | Middleware | Module |
|-------------|-----------|--------|
| `POST /messages`, `GET /messages`, `GET /messages/:id` | `DualAuthMiddleware` | `MessagingModule` |
| `GET /wabas/:id/templates`, `GET /wabas/:id/templates/:id` | `DualAuthMiddleware` | `TemplateModule` |
| `POST /wabas/:id/templates`, `DELETE /wabas/:id/templates/:id` | `AuthMiddleware` (JWT only) | `TemplateModule` |
| `POST /contacts`, `GET /contacts`, `GET /contacts/:id`, `PUT /contacts/:id` | `DualAuthMiddleware` | `ContactsModule` |
| `DELETE /contacts/:id`, `POST /contacts/import` | `AuthMiddleware` (JWT only) | `ContactsModule` |
| `GET /analytics/*` | `DualAuthMiddleware` | `AnalyticsModule` |
| `GET /analytics/export` | `AuthMiddleware` (JWT only) | `AnalyticsModule` |

---

## Wave 5 — Lifecycle Management

**Goal:** Add revocation and disconnect flows that cleanly invalidate both DB records and Redis cache. Depends on Wave 2 (correct Redis schema) and Wave 3 (phone cache exists).

---

### Task 5.1 — Add `DELETE /api-keys/:id` Endpoint `(Gap F1)`

**Files:** `src/api-key/api-key.controller.ts`, `src/api-key/api-key.service.ts`

| Step | Action |
|------|--------|
| 1 | Add `revokeApiKey(userId, id)` to `ApiKeyService` |
| 2 | Fetch `UserApiKey` by `id` — verify `userId` matches to prevent cross-user revocation |
| 3 | Set `status: false` in DB (soft delete) |
| 4 | Fetch `accessKey` from the record |
| 5 | `DEL apiKey:{accessKey}` in Redis — immediate invalidation |
| 6 | Add `DELETE /api-keys/:id` route to `ApiKeyController` with `AuthMiddleware` |

---

### Task 5.2 — Add `DELETE /wabas/:wabaId/connect` Endpoint `(Gap F5)`

**Files:** `src/waba/waba.controller.ts`, `src/user/user-whatsapp.service.ts`

| Step | Action |
|------|--------|
| 1 | Add `disconnect(userId, wabaId)` to `UserWhatsappService` |
| 2 | Verify `UserWhatsapp` record exists for this `(userId, wabaId)` pair |
| 3 | Delete the `UserWhatsapp` record from DB |
| 4 | Call `redisService.invalidateUserPhones(userId)` — clears all `phone:{id}` entries and the `user:{userId}:phones` Set |
| 5 | Add `DELETE /wabas/:wabaId/connect` route to `WabaController` with `AuthMiddleware` |

---

## Wave 6 — Minor Fixes

**Goal:** Address remaining low-risk quality and reliability gaps. All are independent and can be done in any order or in parallel with other waves.

---

### Task 6.1 — Fix Swagger Title `(Gap M1)`

**File:** `src/main.ts`

| Step | Action |
|------|--------|
| 1 | Update `DocumentBuilder.setTitle()` from `'Utility CRM API'` to `'DraskenLabs WhatsApp Communication API'` |

---

### Task 6.2 — Add Startup Env Var Validation `(Gap M2)`

**File:** `src/app.module.ts`

| Step | Action |
|------|--------|
| 1 | Install `joi` (`npm i joi`) |
| 2 | Add `validationSchema: Joi.object({ PORT, DATABASE_URL, REDIS_HOST, REDIS_PORT, ENCRYPTION_KEY, JWT_SECRET, META_APP_ID, META_APP_SECRET, META_REDIRECT_URI, WEBHOOK_VERIFY_TOKEN })` to `ConfigModule.forRoot()` |
| 3 | Server will throw and refuse to start if any required variable is missing |

**Required variables to validate:**

| Variable | Required |
|----------|----------|
| `PORT` | Yes |
| `DATABASE_URL` | Yes |
| `REDIS_HOST` | Yes |
| `REDIS_PORT` | Yes |
| `ENCRYPTION_KEY` | Yes |
| `JWT_SECRET` | Yes |
| `META_APP_ID` | Yes |
| `META_APP_SECRET` | Yes |
| `META_REDIRECT_URI` | Yes |
| `WEBHOOK_VERIFY_TOKEN` | Yes (when Webhooks module is added) |

---

### Task 6.3 — Add Redis Retry Strategy `(Gap M3)`

**File:** `src/redis/redis.service.ts`

| Step | Action |
|------|--------|
| 1 | Pass `retryStrategy` option to ioredis constructor |
| 2 | Retry up to 10 times with exponential backoff: `Math.min(times * 100, 3000)` ms |
| 3 | After 10 retries, return `null` to stop retrying and surface error |

---

### Task 6.4 — Write Missing Unit Tests `(Gap M4)`

Target: raise coverage from ~8% to ≥80%.

| Test File | What to Cover |
|-----------|--------------|
| `crypto.service.spec.ts` | encrypt/decrypt round-trip, invalid ciphertext throws |
| `auth.middleware.spec.ts` | valid JWT, expired JWT, missing header, deactivated user |
| `user.service.spec.ts` | findById, findByClerkId not-found cases |
| `user-whatsapp.service.spec.ts` | upsert encrypts token, getDecryptedToken decrypts correctly |
| `api-key.service.spec.ts` | key generation, Redis write, listing without secret |
| `api-key.controller.spec.ts` | create returns secret once, list omits secret |
| `waba.service.spec.ts` | ownership check on upsert, Meta API mock |
| `waba-phone-number.service.spec.ts` | sync populates Redis cache |
| `connect.service.spec.ts` | token exchange, state TTL, phone cache population |

---

### Task 6.5 — Add Rate Limiting to `POST /api-keys` `(Gap M5)`

**File:** `src/api-key/api-key.controller.ts`

| Step | Action |
|------|--------|
| 1 | Install `@nestjs/throttler` |
| 2 | Register `ThrottlerModule` in `AppModule` with `ttl: 60, limit: 5` (5 keys per minute per user) |
| 3 | Apply `@UseGuards(ThrottlerGuard)` and `@Throttle(5, 60)` to `POST /api-keys` |

---

## Completion Checklist

### Wave 1 — Critical Security

| Task | Gap | Done |
|------|-----|------|
| 1.1 | C1 — WABA ownership check | ☐ |
| 1.2 | C3 — clientWABAs middleware | ☐ |
| 1.3 | F2 — user.status in AuthMiddleware | ☐ |
| 1.4 | F6 — test-token env gate | ☐ |
| 1.5 | M6 — forbidUnknownValues | ☐ |

### Wave 2 — Redis Redesign

| Task | Gap | Done |
|------|-----|------|
| 2.1 | A5 — Generic Redis operations | ☐ |
| 2.2 | A3 + C2 — API key Redis schema | ☐ |

### Wave 3 — Phone Cache

| Task | Gap | Done |
|------|-----|------|
| 3.1 | A1 + A2 — Phone cache Redis methods | ☐ |
| 3.2 | F4 — Phone sync populates cache | ☐ |
| 3.3 | F3 — Connect flow populates cache | ☐ |

### Wave 4 — API Key Auth

| Task | Gap | Done |
|------|-----|------|
| 4.1 | A4 — ApiKeyMiddleware | ☐ |
| 4.2 | A4 — DualAuthMiddleware | ☐ |
| 4.3 | A4 — Apply to routes | ☐ |

### Wave 5 — Lifecycle

| Task | Gap | Done |
|------|-----|------|
| 5.1 | F1 — DELETE /api-keys/:id | ☐ |
| 5.2 | F5 — DELETE /wabas/:wabaId/connect | ☐ |

### Wave 6 — Minor

| Task | Gap | Done |
|------|-----|------|
| 6.1 | M1 — Swagger title | ☐ |
| 6.2 | M2 — Env var validation | ☐ |
| 6.3 | M3 — Redis retry strategy | ☐ |
| 6.4 | M4 — Unit test coverage | ☐ |
| 6.5 | M5 — Rate limiting on api-keys | ☐ |
