# Phase 5 – API Key Management: Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| 5.1 | API Key DTOs | Define request/response DTOs for key creation and listing | `CreateApiKeyDto`, `ApiKeyResponseDto` |
| 5.2 | ApiKeyService – Generation | Implement key pair generation, encryption, DB write, Redis cache | Key created and cached |
| 5.3 | ApiKeyService – Listing | Implement listing user's API keys with masked secret | `findAllByUserId` |
| 5.4 | ApiKeyController | Implement `POST /api-keys` and `GET /api-keys` with auth | Both endpoints live |

---

## Wave Detail

### Wave 5.1 – API Key DTOs

| Task | Notes |
|------|-------|
| `CreateApiKeyDto` | Optional `name` or `description` field |
| `ApiKeyResponseDto` | `id`, `accessKey`, `secretKey` (on create only), `status`, `createdAt` |
| Swagger decorators | `@ApiProperty()` on all fields |
| Mark `secretKey` as write-once in docs | Document that secret is only returned at creation |

### Wave 5.2 – ApiKeyService – Generation

| Task | Notes |
|------|-------|
| Generate `accessKey` | `uuid()` |
| Generate `secretKey` | `uuid()` |
| Encrypt `secretKey` | Via `EncryptionService.encrypt()` |
| Write `UserApiKey` to DB | With `userId`, `accessKey`, encrypted `secretKey` |
| Cache in Redis | `apiKey:{accessKey}` → `{ userId, secretKey: encrypted }` |
| Return plaintext `secretKey` once | Only in creation response |

### Wave 5.3 – ApiKeyService – Listing

| Task | Notes |
|------|-------|
| `findAllByUserId(userId)` | Query `UserApiKey` by userId |
| Exclude decrypted secret from list | Return `accessKey` and metadata only |
| Filter by `status: true` | Only show active keys |

### Wave 5.4 – ApiKeyController

| Task | Notes |
|------|-------|
| `POST /api-keys` | Requires auth; calls service generation; returns key pair |
| `GET /api-keys` | Requires auth; lists user's keys without secrets |
| Swagger documentation | Document creation response with secret-key warning |

---

## Redis Key Schema

| Key Pattern | Value | TTL |
|-------------|-------|-----|
| `apiKey:{accessKey}` | `JSON { userId, secretKey }` | None (persistent) |
