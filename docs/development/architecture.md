# Architectural Design — DraskenLabs WhatsApp Communication API

---

## Table of Contents

| # | Section |
|---|---------|
| 1 | [System Context](#1-system-context) |
| 2 | [High-Level Component Architecture](#2-high-level-component-architecture) |
| 3 | [Authentication Architecture](#3-authentication-architecture) |
| 4 | [Multi-WABA Phone Resolution Architecture](#4-multi-waba-phone-resolution-architecture) |
| 5 | [Redis Key Architecture](#5-redis-key-architecture) |
| 6 | [Message Send Request Flow](#6-message-send-request-flow) |
| 7 | [Webhook Inbound Event Flow](#7-webhook-inbound-event-flow) |
| 8 | [Database Schema Architecture](#8-database-schema-architecture) |
| 9 | [Cache Population & Invalidation Strategy](#9-cache-population--invalidation-strategy) |
| 10 | [Module Dependency Graph](#10-module-dependency-graph) |
| 11 | [Encryption Architecture](#11-encryption-architecture) |
| 12 | [API Layer Design](#12-api-layer-design) |
| 13 | [Security Layers](#13-security-layers) |
| 14 | [Design Principles](#14-design-principles) |

---

## 1. System Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL ACTORS                                │
│                                                                         │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐ │
│   │  Platform    │    │  Integration │    │   Meta / WhatsApp        │ │
│   │  User        │    │  Client      │    │   Business Platform      │ │
│   │  (Browser)   │    │  (API Key)   │    │   (Graph API + Webhooks) │ │
│   └──────┬───────┘    └──────┬───────┘    └────────────┬─────────────┘ │
└──────────┼───────────────────┼─────────────────────────┼───────────────┘
           │ JWT               │ x-access-key            │ HTTPS Events
           │                   │ x-secret-key            │ (Webhook POST)
           ▼                   ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    DraskenLabs WhatsApp API                              │
│                        (NestJS — Port 3000)                             │
└──────────────────────────────────────────────────────────────────────────┘
           │                                             │
           ▼                                             ▼
┌─────────────────────┐                    ┌─────────────────────────────┐
│   PostgreSQL DB     │                    │   Redis Cache               │
│   (Prisma ORM)      │                    │   (ioredis)                 │
└─────────────────────┘                    └─────────────────────────────┘
```

| Actor | Interaction | Auth Method |
|-------|-------------|-------------|
| Platform User (Browser) | User-facing API calls | JWT (`Authorization: Bearer`) |
| Integration Client | Programmatic / automation calls | API Key (`x-access-key` + `x-secret-key`) |
| Meta / WhatsApp Platform | Outbound: Graph API calls; Inbound: Webhook events | HMAC-SHA256 (webhooks), Bearer token (Graph API) |

---

## 2. High-Level Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NestJS Application                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      API Gateway Layer                           │   │
│  │  ┌──────────────────┐          ┌──────────────────────────────┐ │   │
│  │  │  JWT Middleware   │          │  API Key Middleware           │ │   │
│  │  │  (Clerk-backed)  │          │  (Redis fast-lookup)         │ │   │
│  │  └──────────────────┘          └──────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────────────────┐│   │
│  │  │  GlobalExceptionFilter  │  BaseResponseInterceptor          ││   │
│  │  │  ValidationPipe         │  CORS / CookieParser              ││   │
│  │  └─────────────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Product Modules                              │   │
│  │                                                                  │   │
│  │  ┌────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │   │
│  │  │    Auth    │  │ Acct Management  │  │     Messaging        │ │   │
│  │  │            │  │ (Connect/WABA/   │  │  (Send/Status/List) │ │   │
│  │  │ JWT + Keys │  │  PhoneNumbers)   │  │                     │ │   │
│  │  └────────────┘  └──────────────────┘  └─────────────────────┘ │   │
│  │                                                                  │   │
│  │  ┌────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │   │
│  │  │ Templates  │  │    Webhooks      │  │     Contacts         │ │   │
│  │  │            │  │ (Inbound Events) │  │                     │ │   │
│  │  │ CRUD+Sync  │  │                  │  │  CRUD + Opt-outs    │ │   │
│  │  └────────────┘  └──────────────────┘  └─────────────────────┘ │   │
│  │                                                                  │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │                     Analytics                              │ │   │
│  │  │              (Metrics / Reports / Export)                  │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   Infrastructure Layer                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │ PrismaModule │  │  RedisModule │  │    CommonModule       │  │   │
│  │  │ (Global DB)  │  │ (Global Cache│  │  (Crypto / Response) │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  Meta Integration Layer                          │   │
│  │         axios → graph.facebook.com/v25.0/{resource}             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

| Layer | Components | Responsibility |
|-------|-----------|----------------|
| API Gateway | JWT Middleware, API Key Middleware, ValidationPipe, ExceptionFilter, ResponseInterceptor | Auth, input validation, response normalisation |
| Product Modules | Auth, Account Management, Messaging, Templates, Webhooks, Contacts, Analytics | All business logic |
| Infrastructure | PrismaModule, RedisModule, CommonModule | DB, cache, encryption — shared globally |
| Meta Integration | axios client | All outbound calls to Meta Graph API v25.0 |

---

## 3. Authentication Architecture

```
                  ┌─────────────────────────────────────────┐
                  │         Two Auth Strategies             │
                  └────────────────┬────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
              ▼                                         ▼
   ┌──────────────────────┐               ┌────────────────────────┐
   │   Strategy A: JWT    │               │  Strategy B: API Key   │
   │   (User-facing)      │               │  (Integration clients) │
   └──────────┬───────────┘               └───────────┬────────────┘
              │                                        │
              ▼                                        ▼
   Authorization: Bearer <jwt>          x-access-key: <uuid>
                                        x-secret-key: <uuid>
              │                                        │
              ▼                                        ▼
   ┌──────────────────────┐          ┌─────────────────────────────┐
   │   Verify JWT         │          │  Redis Lookup               │
   │   JWT_SECRET         │          │  apiKey:{accessKey}         │
   │   Extract sub=clerkId│          │  → { userId, secretKey }    │
   └──────────┬───────────┘          └──────────────┬──────────────┘
              │                                      │
              ▼                                      ▼
   ┌──────────────────────┐          ┌─────────────────────────────┐
   │   DB Lookup          │          │  Decrypt + Compare          │
   │   User by clerkId    │          │  secretKey vs header        │
   └──────────┬───────────┘          └──────────────┬──────────────┘
              │                                      │
              ▼                                      ▼
   ┌──────────────────────┐          ┌─────────────────────────────┐
   │  req.user = User     │          │  DB Lookup                  │
   │  (full user object)  │          │  User by userId             │
   └──────────────────────┘          └──────────────┬──────────────┘
                                                     │
                                                     ▼
                                      ┌─────────────────────────────┐
                                      │  req.user = User            │
                                      │  req.authType = 'apiKey'    │
                                      └─────────────────────────────┘
```

| Strategy | Token Location | Validation Steps | Failure Response |
|----------|---------------|-----------------|-----------------|
| JWT | `Authorization: Bearer <token>` | Verify signature → extract `sub` → load user by `clerkId` | 401 Unauthorized |
| API Key | `x-access-key` + `x-secret-key` headers | Redis lookup → decrypt secret → compare → load user by `userId` | 401 Unauthorized |

---

## 4. Multi-WABA Phone Resolution Architecture

One API key belongs to one user. That user may have many WABAs each with many phone numbers. At message-send time, the system resolves which access token to use based on the `phoneNumberId` provided in the request.

```
  USER
  │
  │  has many
  ├──────────────────────────────────────────────┐
  │                                              │
  ▼                                              ▼
WABA A                                         WABA B
  │  accessToken_A (encrypted)                   │  accessToken_B (encrypted)
  │  stored in UserWhatsapp                      │  stored in UserWhatsapp
  │                                              │
  ├── Phone #1  ──────────────────────────────►  phone:{phoneNumberId_1}
  │               { userId, wabaId_A,            │   = { userId, wabaId_A,
  │                 accessToken_A }              │     accessToken_A }
  │                                              │
  └── Phone #2  ──────────────────────────────►  phone:{phoneNumberId_2}
                  { userId, wabaId_A,                = { userId, wabaId_A,
                    accessToken_A }                    accessToken_A }

                                               phone:{phoneNumberId_3}
                                                   = { userId, wabaId_B,
                                                     accessToken_B }

                                               phone:{phoneNumberId_4}
                                                   = { userId, wabaId_B,
                                                     accessToken_B }

                                    ┌──────────────────────────────────┐
                                    │  user:{userId}:phones (Redis Set) │
                                    │  { phoneId_1, phoneId_2,         │
                                    │    phoneId_3, phoneId_4 }        │
                                    └──────────────────────────────────┘
                                    (used only for cache invalidation)
```

| Redis Key | Purpose | Written When |
|-----------|---------|--------------|
| `phone:{phoneNumberId}` | Resolve access token at send time — O(1) lookup | Phone number sync |
| `user:{userId}:phones` | Index all phone IDs for a user — bulk invalidation | Phone number sync |

**Ownership Enforcement:** When the `phone:{phoneNumberId}` entry is retrieved, the `userId` inside it is compared against the `userId` from the API key auth. If they differ, the request is rejected with `403 Forbidden`. This prevents one user from sending messages via another user's phone numbers.

---

## 5. Redis Key Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REDIS KEY DESIGN                                │
├─────────────────────┬───────────┬──────────────────────┬───────────────┤
│ Key Pattern         │ Type      │ Value Shape           │ TTL           │
├─────────────────────┼───────────┼──────────────────────┼───────────────┤
│ apiKey:{accessKey}  │ String    │ {                     │ None          │
│                     │ (JSON)    │   userId: number,     │ (persistent)  │
│                     │           │   secretKey: string   │               │
│                     │           │ }                     │               │
├─────────────────────┼───────────┼──────────────────────┼───────────────┤
│ phone:{phoneId}     │ String    │ {                     │ None          │
│                     │ (JSON)    │   userId: number,     │ (persistent)  │
│                     │           │   wabaId: string,     │               │
│                     │           │   accessToken: string │               │
│                     │           │ }  ← encrypted        │               │
├─────────────────────┼───────────┼──────────────────────┼───────────────┤
│ user:{id}:phones    │ Set       │ [ phoneId, phoneId ]  │ None          │
│                     │           │                       │ (persistent)  │
├─────────────────────┼───────────┼──────────────────────┼───────────────┤
│ waba:connect:       │ String    │ {                     │ 300s          │
│ state:{uuid}        │ (JSON)    │   userId: number,     │ (OAuth flow)  │
│                     │           │   accessToken: string,│               │
│                     │           │   businesses: []      │               │
│                     │           │ }                     │               │
└─────────────────────┴───────────┴──────────────────────┴───────────────┘
```

| Design Decision | Reason |
|----------------|--------|
| Separate `phone:{id}` key per phone number | O(1) send-time lookup without scanning a large user-level structure |
| `user:{userId}:phones` as a Redis Set | Enables atomic bulk invalidation on WABA disconnect without knowing phone IDs upfront |
| No TTL on persistent keys | Invalidated explicitly on business events (disconnect, revoke) — not time-based |
| Access tokens stored encrypted in Redis | Redis is not encrypted at rest by default — never store plaintext tokens |

---

## 6. Message Send Request Flow

```
  Client (API Key)
       │
       │  POST /messages
       │  x-access-key: abc
       │  x-secret-key: xyz
       │  body: { phoneNumberId, to, type, text }
       │
       ▼
┌─────────────────────────────────────────────────┐
│             API Key Middleware                   │
│                                                  │
│  1. GET apiKey:abc  ──► Redis                   │
│     └── { userId: 1, secretKey: encrypted }     │
│  2. decrypt(secretKey) == xyz  ?                │
│     └── NO  → 401 Unauthorized                  │
│     └── YES → continue                          │
│  3. Load User from DB by userId                 │
│  4. Attach req.user, req.authType               │
└─────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           MessagingController                    │
│  Extract phoneNumberId from body                 │
└─────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│             MessagingService                     │
│                                                  │
│  1. GET phone:{phoneNumberId}  ──► Redis        │
│     └── { userId, wabaId, accessToken }         │
│                                                  │
│  2. Assert phone.userId == req.user.id          │
│     └── NO  → 403 Forbidden                     │
│     └── YES → continue                          │
│                                                  │
│  3. decrypt(accessToken) → plainTextToken       │
│                                                  │
│  4. Call Meta Graph API                         │
│     POST /{phoneNumberId}/messages              │
│     Authorization: Bearer {plainTextToken}      │
│     body: { to, type, text: { body } }          │
│                                                  │
│  5. Persist Message to DB                       │
│     { metaMessageId, phoneNumberId, to,         │
│       type, payload, status: 'sent', userId }   │
│                                                  │
│  6. Return MessageResponseDto                   │
└─────────────────────────────────────────────────┘
       │
       ▼
  { messageId, status: 'sent', to, createdAt }
```

| Step | Cache / DB Hit | Failure Mode |
|------|---------------|--------------|
| API key lookup | Redis | 401 if key not found or secret mismatch |
| User load | PostgreSQL | 401 if user not found or inactive |
| Phone number lookup | Redis | 404 if phone not cached (not synced) |
| Ownership check | In-memory | 403 if phone belongs to different user |
| Meta API call | External (Meta) | 502 / Meta error code propagated |
| Message persist | PostgreSQL | 500 on DB write failure |

---

## 7. Webhook Inbound Event Flow

```
  Meta Platform
       │
       │  POST /webhooks
       │  X-Hub-Signature-256: sha256=...
       │  body: { object, entry: [{ changes: [...] }] }
       │
       ▼
┌─────────────────────────────────────────────────┐
│         Signature Validation Middleware          │
│  HMAC-SHA256(rawBody, META_APP_SECRET)          │
│  != X-Hub-Signature-256  → 401                 │
└─────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│             WebhooksController                   │
│  Return 200 immediately ← Meta needs fast ack   │
│  Hand off to async processor                    │
└─────────────────────────────────────────────────┘
       │
       ▼ (async)
┌─────────────────────────────────────────────────────────────────────┐
│                     WebhooksService (Event Router)                   │
│                                                                       │
│  entry.changes[].field  →  handler                                   │
│                                                                       │
│  ┌─────────────┐   ┌──────────────────┐   ┌──────────────────────┐  │
│  │  "messages" │   │   "statuses"     │   │ "message_template_   │  │
│  │             │   │                  │   │  status_update"      │  │
│  │  Persist    │   │  Update Message  │   │  Update Template     │  │
│  │  Inbound    │   │  .status in DB   │   │  .status in DB       │  │
│  │  Message    │   │  sent→delivered  │   │  PENDING→APPROVED    │  │
│  │  to DB      │   │  →read / failed  │   │  / REJECTED          │  │
│  └──────┬──────┘   └──────────────────┘   └──────────────────────┘  │
│         │                                                             │
│         ▼                                                             │
│   Mark as Read (optional)                                             │
│   PUT /{phoneNumberId}/messages via MessagingService                 │
└─────────────────────────────────────────────────────────────────────┘
```

| Webhook Field | Handler | DB Write |
|--------------|---------|----------|
| `messages` | Inbound message handler | Insert `InboundMessage` |
| `statuses` | Status update handler | Update `Message.status` |
| `message_template_status_update` | Template handler | Update `MessageTemplate.status` |
| `account_update` | Account handler | Log / store for monitoring |
| `phone_number_quality_update` | Account handler | Log / store for monitoring |

**Design Rule:** Webhook endpoint must always return `200` within Meta's timeout window. All processing happens asynchronously after the response is sent.

---

## 8. Database Schema Architecture

```
┌─────────────┐        ┌──────────────────┐        ┌───────────────────┐
│    User     │1      *│  UserWhatsapp    │        │    UserApiKey     │
│─────────────│◄───────│──────────────────│        │───────────────────│
│ id          │        │ id               │        │ id                │
│ clerkId     │        │ userId  (FK)     │        │ userId  (FK)      │
│ firstName   │        │ businessId       │        │ accessKey         │
│ lastName    │        │ phoneNumberId    │        │ secretKey (enc)   │
│ email       │        │ wabaId           │        │ status            │
│ status      │        │ accessToken(enc) │        │ createdAt         │
│ createdAt   │        │ createdAt        │        │ updatedAt         │
└──────┬──────┘        │ updatedAt        │        └───────────────────┘
       │               └──────────────────┘
       │ 1
       │
       │ *
┌──────▼──────┐        ┌──────────────────┐
│    Waba     │1      *│  WabaPhoneNumber │
│─────────────│◄───────│──────────────────│
│ id          │        │ id               │
│ wabaId      │        │ phoneNumberId    │
│ name        │        │ verifiedName     │
│ currency    │        │ displayPhone     │
│ timezoneId  │        │ qualityRating    │
│ namespace   │        │ platformType     │
│ userId (FK) │        │ throughputLevel  │
│ createdAt   │        │ wabaId  (FK)     │
│ updatedAt   │        │ createdAt        │
└─────────────┘        │ updatedAt        │
                       └──────────────────┘

  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
  │    Message       │   │  InboundMessage  │   │ MessageTemplate  │
  │──────────────────│   │──────────────────│   │──────────────────│
  │ id               │   │ id               │   │ id               │
  │ metaMessageId    │   │ metaMessageId    │   │ metaTemplateId   │
  │ phoneNumberId    │   │ from             │   │ wabaId    (FK)   │
  │ to               │   │ phoneNumberId    │   │ name             │
  │ type (enum)      │   │ type             │   │ category (enum)  │
  │ payload  (JSON)  │   │ payload  (JSON)  │   │ language         │
  │ status   (enum)  │   │ timestamp        │   │ status   (enum)  │
  │ userId   (FK)    │   │ createdAt        │   │ components(JSON) │
  │ createdAt        │   └──────────────────┘   │ rejectedReason   │
  │ updatedAt        │                          │ createdAt        │
  └──────────────────┘   ┌──────────────────┐   └──────────────────┘
                         │  WebhookEvent    │
                         │──────────────────│
                         │ id               │
                         │ eventType        │
                         │ payload  (JSON)  │
                         │ processed        │
                         │ phoneNumberId    │
                         │ createdAt        │
                         └──────────────────┘

  ┌──────────────────┐
  │    Contact       │
  │──────────────────│
  │ id               │
  │ userId   (FK)    │
  │ phoneNumber      │
  │ firstName        │
  │ lastName         │
  │ email            │
  │ waId             │
  │ isValid          │
  │ isOptedOut       │
  │ tags    (array)  │
  │ metadata (JSON)  │
  │ status           │
  │ createdAt        │
  │ updatedAt        │
  └──────────────────┘
```

### Model Inventory

| Model | Status | Purpose |
|-------|--------|---------|
| `User` | ✅ Live | Platform user account |
| `UserWhatsapp` | ✅ Live | User ↔ WABA connection with encrypted access token |
| `Waba` | ✅ Live | WhatsApp Business Account record |
| `WabaPhoneNumber` | ✅ Live | Phone numbers registered under a WABA |
| `UserApiKey` | ✅ Live | API key pairs for programmatic access |
| `Message` | ❌ Planned | Outbound message records with status tracking |
| `InboundMessage` | ❌ Planned | Inbound messages received via webhooks |
| `MessageTemplate` | ❌ Planned | WhatsApp message templates per WABA |
| `WebhookEvent` | ❌ Planned | Raw webhook event log |
| `Contact` | ❌ Planned | WhatsApp recipient directory |

### Key Enums (Planned)

| Enum | Values |
|------|--------|
| `MessageType` | `text`, `image`, `video`, `audio`, `document`, `template`, `interactive`, `location`, `reaction`, `contacts` |
| `MessageStatus` | `sent`, `delivered`, `read`, `failed` |
| `TemplateCategory` | `MARKETING`, `UTILITY`, `AUTHENTICATION` |
| `TemplateStatus` | `PENDING`, `APPROVED`, `REJECTED`, `DISABLED`, `IN_APPEAL`, `DELETED` |

---

## 9. Cache Population & Invalidation Strategy

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CACHE LIFECYCLE EVENTS                            │
├────────────────────────────┬─────────────────────────────────────────┤
│ Event                      │ Redis Operation                         │
├────────────────────────────┼─────────────────────────────────────────┤
│ POST /api-keys             │ SET apiKey:{accessKey}                  │
│                            │ → { userId, secretKey }                 │
├────────────────────────────┼─────────────────────────────────────────┤
│ DELETE /api-keys/:id       │ DEL apiKey:{accessKey}                  │
├────────────────────────────┼─────────────────────────────────────────┤
│ Phone number sync          │ SET phone:{phoneNumberId}               │
│ (POST /phone-numbers/sync) │ → { userId, wabaId, accessToken }      │
│                            │ SADD user:{userId}:phones {phoneId}     │
├────────────────────────────┼─────────────────────────────────────────┤
│ WABA disconnect            │ SMEMBERS user:{userId}:phones           │
│                            │   → for each: DEL phone:{phoneId}      │
│                            │ DEL user:{userId}:phones                │
├────────────────────────────┼─────────────────────────────────────────┤
│ Access token refresh       │ For each phoneId in WABA:               │
│                            │   SET phone:{phoneId}.accessToken       │
├────────────────────────────┼─────────────────────────────────────────┤
│ POST /connect (OAuth)      │ SETEX waba:connect:state:{uuid} 300    │
│                            │ → { userId, accessToken, businesses }   │
├────────────────────────────┼─────────────────────────────────────────┤
│ OAuth flow complete        │ DEL waba:connect:state:{uuid}           │
└────────────────────────────┴─────────────────────────────────────────┘
```

### Cache vs DB Responsibility

| Data | Cache (Redis) | DB (PostgreSQL) |
|------|--------------|-----------------|
| API key auth lookup | ✅ Primary | ✅ Source of truth |
| Phone → access token | ✅ Primary | ✅ Source of truth (`UserWhatsapp`) |
| User phone index | ✅ Only (for invalidation) | Derivable from `UserWhatsapp` |
| OAuth flow state | ✅ Only (TTL: 300s) | ❌ Never persisted |
| Message records | ❌ No | ✅ Only |
| Contacts | ❌ No | ✅ Only |
| Templates | ❌ No | ✅ Only |
| Analytics data | ❌ No (query on demand) | ✅ Only |

---

## 10. Module Dependency Graph

```
                        ┌─────────────────┐
                        │    Analytics    │
                        └────────┬────────┘
                                 │ reads from
              ┌──────────────────┼──────────────────┐
              │                  │                   │
              ▼                  ▼                   ▼
      ┌───────────────┐  ┌──────────────┐  ┌───────────────┐
      │   Messaging   │  │  Templates   │  │   Contacts    │
      └───────┬───────┘  └──────┬───────┘  └───────┬───────┘
              │                  │                   │
              │◄─────────────────┤                   │
              │    uses tokens   │                   │
              ▼                  ▼                   ▼
      ┌────────────────────────────────────────────────────┐
      │               Account Management                   │
      │           (Connect / WABA / PhoneNumbers)          │
      └────────────────────────┬───────────────────────────┘
                               │ uses
                               ▼
                      ┌─────────────────┐
                      │      Auth       │
                      │  (JWT + APIKey) │
                      └────────┬────────┘
                               │ uses
              ┌────────────────┼──────────────────┐
              ▼                ▼                   ▼
   ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐
   │  PrismaModule   │  │ RedisModule  │  │  CommonModule    │
   │  (DB / Global)  │  │(Cache/Global)│  │ (Crypto/Global)  │
   └─────────────────┘  └──────────────┘  └──────────────────┘


      ┌──────────────────────────────────┐
      │           Webhooks               │  ← standalone, writes to
      │   (Inbound events from Meta)     │     Messaging, Templates,
      └──────────────────────────────────┘     Contacts tables
```

| Module | Depends On | Depended On By |
|--------|-----------|----------------|
| Analytics | Messaging, Templates, Contacts | — |
| Messaging | Account Management, Auth | Analytics, Webhooks |
| Templates | Account Management, Auth | Analytics, Webhooks, Messaging |
| Contacts | Auth | Analytics, Webhooks, Messaging |
| Webhooks | Messaging, Templates, Contacts | — |
| Account Management | Auth | Messaging, Templates |
| Auth | Prisma, Redis, Common | All modules |
| Prisma, Redis, Common | — | All modules |

---

## 11. Encryption Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    What Gets Encrypted                          │
├────────────────────────┬──────────────────────────────────────┤
│ Data                   │ Storage Location                      │
├────────────────────────┼──────────────────────────────────────┤
│ Meta access token      │ PostgreSQL (UserWhatsapp.accessToken) │
│                        │ Redis (phone:{id}.accessToken)        │
├────────────────────────┼──────────────────────────────────────┤
│ API secret key         │ PostgreSQL (UserApiKey.secretKey)     │
│                        │ Redis (apiKey:{key}.secretKey)        │
└────────────────────────┴──────────────────────────────────────┘
```

```
          AES-256-GCM Encryption Model
          ─────────────────────────────
          Plaintext
              │
              ▼
          ┌────────────────────────────────────────┐
          │  IV (12 bytes, random per call)        │
          │  Key (32 bytes from ENCRYPTION_KEY env)│
          │  Auth Tag (16 bytes, GCM output)       │
          └─────────────────────────┬──────────────┘
                                    │
                                    ▼
                         "iv:authTag:ciphertext"
                         (stored as hex string)

          Decryption is identical in reverse.
          Wrong key or tampered data → throws.
```

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key Length | 256 bits (32 bytes) |
| Key Source | `ENCRYPTION_KEY` env var (base64-encoded) |
| IV | 12 bytes, randomly generated per `encrypt()` call |
| Auth Tag | 16 bytes, GCM-produced — detects tampering |
| Output Format | `iv:authTag:ciphertext` (colon-delimited hex) |
| Decryption Failure | Throws — never silently returns garbage |

---

## 12. API Layer Design

```
┌──────────────────────────────────────────────────────────────────────┐
│                         REST API Surface                             │
├────────────────────────────────────────────────────────────────────┤
│  AUTH & USER                                                         │
│   GET   /user/profile              JWT                               │
│   POST  /user/test-token           None  (dev only)                 │
│   POST  /api-keys                  JWT                               │
│   GET   /api-keys                  JWT                               │
│   DELETE /api-keys/:id             JWT                               │
├────────────────────────────────────────────────────────────────────┤
│  ACCOUNT MANAGEMENT                                                  │
│   POST  /connect                   JWT                               │
│   GET   /connect/businesses        None  (OAuth state)              │
│   GET   /connect/:id/ownedWABAs    None  (OAuth state)              │
│   GET   /connect/:id/clientWABAs   None  (OAuth state)              │
│   POST  /connect/debugToken        None                              │
│   GET   /wabas                     JWT                               │
│   GET   /wabas/:wabaId             JWT                               │
│   POST  /wabas/:wabaId/sync        JWT                               │
│   DELETE /wabas/:wabaId/connect    JWT                               │
│   GET   /wabas/:id/phone-numbers   JWT                               │
│   POST  /wabas/:id/phone-numbers/sync  JWT                          │
├────────────────────────────────────────────────────────────────────┤
│  MESSAGING                                                           │
│   POST  /messages                  JWT | API Key                    │
│   GET   /messages                  JWT | API Key                    │
│   GET   /messages/:id              JWT | API Key                    │
├────────────────────────────────────────────────────────────────────┤
│  TEMPLATES                                                           │
│   GET   /wabas/:id/templates       JWT | API Key                    │
│   POST  /wabas/:id/templates       JWT                               │
│   GET   /wabas/:id/templates/:id   JWT | API Key                    │
│   DELETE /wabas/:id/templates/:id  JWT                               │
│   POST  /wabas/:id/templates/sync  JWT                               │
├────────────────────────────────────────────────────────────────────┤
│  CONTACTS                                                            │
│   POST  /contacts                  JWT | API Key                    │
│   GET   /contacts                  JWT | API Key                    │
│   GET   /contacts/:id              JWT | API Key                    │
│   PUT   /contacts/:id              JWT | API Key                    │
│   DELETE /contacts/:id             JWT                               │
│   POST  /contacts/import           JWT                               │
│   POST  /contacts/:id/opt-out      JWT | API Key                    │
│   DELETE /contacts/:id/opt-out     JWT                               │
├────────────────────────────────────────────────────────────────────┤
│  WEBHOOKS                                                            │
│   GET   /webhooks                  None  (Meta challenge)           │
│   POST  /webhooks                  None  (HMAC-SHA256 verified)     │
├────────────────────────────────────────────────────────────────────┤
│  ANALYTICS                                                           │
│   GET   /analytics/overview        JWT | API Key                    │
│   GET   /analytics/messages        JWT | API Key                    │
│   GET   /analytics/templates       JWT | API Key                    │
│   GET   /analytics/contacts        JWT | API Key                    │
│   GET   /analytics/phone-numbers   JWT | API Key                    │
│   GET   /analytics/export          JWT                               │
└────────────────────────────────────────────────────────────────────┘
```

### Standard Response Shape (`BaseResponse<T>`)

| Field | Type | Always Present | Description |
|-------|------|---------------|-------------|
| `statusCode` | number | ✅ Yes | HTTP status code |
| `message` | string | ✅ Yes | Human-readable result message |
| `data` | T | ❌ No | Typed payload on success |
| `errors` | `FieldErrorResponse[]` | ❌ No | Validation errors (422 only) |
| `meta` | object | ❌ No | Pagination metadata (`total`, `page`, `limit`, `totalPages`) |

---

## 13. Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Security Layers                              │
│                                                                     │
│  Layer 1 — Transport                                                │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  HTTPS only (TLS 1.2+)  │  CORS configured                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Layer 2 — Authentication                                           │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  JWT middleware (Clerk)  │  API Key middleware (Redis)      │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Layer 3 — Authorisation                                            │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Phone ownership check   │  WABA ownership check           │    │
│  │  userId == phone.userId  │  wabaId belongs to user         │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Layer 4 — Input Validation                                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  ValidationPipe (class-validator)  │  whitelist: true      │    │
│  │  transform: true                   │  422 on failure       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Layer 5 — Webhook Integrity                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  HMAC-SHA256 of raw body vs X-Hub-Signature-256            │    │
│  │  Constant-time comparison (timing attack safe)             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Layer 6 — Data at Rest                                             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  AES-256-GCM for access tokens + API secret keys           │    │
│  │  Unique IV per encryption call                             │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

| Layer | Threat Mitigated | Implementation |
|-------|-----------------|----------------|
| Transport | Man-in-the-middle | HTTPS / TLS |
| Authentication | Unauthorised access | JWT signature verification, API key lookup + secret comparison |
| Authorisation | Cross-user data access | `userId` ownership assertion at service layer |
| Input Validation | Injection, malformed input | `class-validator` with `whitelist: true` |
| Webhook Integrity | Spoofed Meta events | HMAC-SHA256 constant-time signature check |
| Data at Rest | Credential theft from DB/cache | AES-256-GCM with random IV per write |

---

## 14. Design Principles

| Principle | How Applied |
|-----------|-------------|
| **Cache for speed, DB for truth** | Redis holds hot lookup data; PostgreSQL is the source of truth for all persistent state |
| **Encrypt at the edge** | Sensitive tokens encrypted before leaving the service layer — never stored or returned as plaintext |
| **Ownership enforced at service layer** | Every resource access asserts `userId` ownership before proceeding — not just at auth middleware |
| **Meta is source of truth** | WABA, phone number, and template data always synced from Meta — local DB is a cache of Meta state |
| **Fast webhook ack** | Webhooks return `200` immediately and process async — Meta enforces a strict response timeout |
| **Fail fast on config** | Missing env vars must abort server start — never fail silently at runtime |
| **Soft delete everywhere** | `status: false` over hard deletes — preserves audit trail and allows recovery |
| **Idempotent syncs** | All sync operations use upsert — safe to call multiple times without side effects |
| **Single API key, any phone number** | API keys are user-scoped; phone resolution happens at request time via Redis — no key-per-phone complexity |
| **Async webhook processing** | Inbound events are acknowledged immediately and processed in the background to prevent Meta retry storms |
