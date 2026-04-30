# Phase 1 – Foundation & Infrastructure: Definition

## Purpose

Establishes the core technical foundation of the WhatsApp API service. This phase introduces the project skeleton, database ORM layer, in-memory caching, shared utilities (encryption, response formatting, exception handling), and global configuration — enabling all subsequent phases to build on a stable, reusable base.

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| NestJS project bootstrap | ✅ Yes | — |
| Database ORM (Prisma + PostgreSQL) | ✅ Yes | — |
| Redis caching layer | ✅ Yes | — |
| Encryption service (AES-256-GCM) | ✅ Yes | — |
| Global response interceptor | ✅ Yes | — |
| Global exception filter | ✅ Yes | — |
| Swagger/OpenAPI setup | ✅ Yes | — |
| Business logic (endpoints) | ❌ No | Handled in subsequent phases |
| Authentication middleware | ❌ No | Handled in Phase 3 |

---

## Modules Introduced

| Module | Role |
|--------|------|
| `AppModule` | Root module — wires everything together |
| `PrismaModule` | Global database ORM service |
| `RedisModule` | Global caching / state service |
| `CommonModule` | Global encryption, response helpers, filters |

---

## Key Architectural Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| ORM | Prisma | Type-safe, schema-first, excellent DX |
| Caching | Redis (ioredis) | Reliable, supports TTL-based state |
| DB connection pooling | `@prisma/adapter-pg` | Native pg pooler for performance |
| Encryption | AES-256-GCM | Authenticated encryption, industry standard |
| Response format | Standardized `BaseResponse<T>` | Consistent API surface for consumers |
| Exception handling | Global `ExceptionFilter` | Centralized error transformation |

---

## Deliverables

| Deliverable | Description |
|-------------|-------------|
| Working NestJS server | Starts, listens on configurable port |
| Prisma schema | 5 models: User, UserWhatsapp, Waba, WabaPhoneNumber, UserApiKey |
| Redis connection | Global service with get/set/del operations |
| EncryptionService | `encrypt(text)` / `decrypt(ciphertext)` via AES-256-GCM |
| BaseResponse wrapper | Intercepts all responses, applies standard shape |
| GlobalExceptionFilter | Catches all errors, returns structured JSON |
| Swagger UI | Available at `/swagger/docs` |
