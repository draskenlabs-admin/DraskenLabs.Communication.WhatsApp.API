# Phase 1 – Foundation & Infrastructure: Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| 1.1 | Project Bootstrap | Initialize NestJS project, configure TypeScript, set up `nest-cli.json`, install core dependencies | Working server on `PORT` env var |
| 1.2 | Environment Configuration | Add `@nestjs/config`, `.env` loading, validate required variables at startup | Config module available globally |
| 1.3 | Prisma & Database | Define Prisma schema (5 models), configure `@prisma/adapter-pg`, implement `PrismaService` | Database connection, migrations |
| 1.4 | Redis Cache | Install `ioredis`, implement `RedisService` with get/set/del/expire, register as global module | Redis connection available anywhere |
| 1.5 | Common Utilities | Implement `EncryptionService` (AES-256-GCM), `BaseResponse`, `GlobalExceptionFilter`, `BaseResponseInterceptor` | Shared utilities usable by all modules |
| 1.6 | Swagger Setup | Install `@nestjs/swagger`, configure `DocumentBuilder`, mount at `/swagger/docs`, expose JSON at `/swagger/json` | Live Swagger UI |
| 1.7 | Root Endpoint | Implement `GET /` returning API name, docs URL, and OpenAPI JSON URL | Root health/info endpoint live |

---

## Wave Detail

### Wave 1.1 – Project Bootstrap

| Task | Owner | Notes |
|------|-------|-------|
| `nest new` project scaffold | Dev | NestJS v11 |
| Install core dependencies | Dev | `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` |
| Configure `tsconfig.json` | Dev | Strict mode enabled |
| Configure `nest-cli.json` | Dev | Set `sourceRoot: "src"` |

### Wave 1.2 – Environment Configuration

| Task | Owner | Notes |
|------|-------|-------|
| Install `@nestjs/config` | Dev | |
| Create `.env.example` | Dev | Document all required variables |
| Load config in `AppModule` | Dev | `isGlobal: true` |
| Validate required env vars | Dev | Fail fast at startup if missing |

### Wave 1.3 – Prisma & Database

| Task | Owner | Notes |
|------|-------|-------|
| Install `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg` | Dev | |
| Define `schema.prisma` with all 5 models | Dev | See module docs for model definitions |
| Implement `PrismaService` | Dev | Extends `PrismaClient`, global module |
| Run initial migration | Dev | `prisma migrate dev` |

### Wave 1.4 – Redis Cache

| Task | Owner | Notes |
|------|-------|-------|
| Install `ioredis` | Dev | |
| Implement `RedisService` | Dev | get, set, del, expire operations |
| Register `RedisModule` as global | Dev | `isGlobal: true` |
| Configure host/port from env | Dev | `REDIS_HOST`, `REDIS_PORT` |

### Wave 1.5 – Common Utilities

| Task | Owner | Notes |
|------|-------|-------|
| Implement `EncryptionService` | Dev | AES-256-GCM, random IV, auth tag |
| Create `BaseResponse<T>` class | Dev | `statusCode`, `message`, `data`, `errors`, `meta` |
| Create `GlobalExceptionFilter` | Dev | Catches HTTP + unknown exceptions |
| Create `BaseResponseInterceptor` | Dev | Wraps all responses in `BaseResponse` |
| Register filter + interceptor globally | Dev | In `main.ts` |

### Wave 1.6 – Swagger Setup

| Task | Owner | Notes |
|------|-------|-------|
| Install `@nestjs/swagger` | Dev | |
| Configure `DocumentBuilder` | Dev | Title, version, bearer auth |
| Mount Swagger UI at `/swagger/docs` | Dev | |
| Expose OpenAPI JSON at `/swagger/json` | Dev | |

### Wave 1.7 – Root Endpoint

| Task | Owner | Notes |
|------|-------|-------|
| Implement `GET /` in `AppController` | Dev | Returns name, docs URL, openApiJson URL |

---

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server listen port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `ENCRYPTION_KEY` | Base64-encoded 32-byte AES key | `base64string` |
