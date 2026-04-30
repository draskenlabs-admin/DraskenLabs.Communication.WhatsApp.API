# Phase 5 – API Key Management: Definition

## Purpose

Provides a secure API key issuance and management system for authenticated users. API keys allow external clients (integrations, partner systems, automation) to interact with the WhatsApp API without using the primary JWT session. Each key pair consists of a public access key and an encrypted secret key stored in both Redis (for fast lookup) and PostgreSQL (for persistence).

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| Generate access/secret key pairs | ✅ Yes | — |
| Store secret key encrypted in DB | ✅ Yes | — |
| Cache API key in Redis | ✅ Yes | — |
| List user's API keys | ✅ Yes | — |
| Validate API key on requests | ❌ No | Future phase |
| Revoke / delete API keys | ❌ No | Future phase |
| Key rotation | ❌ No | Future phase |
| Key scopes / permissions | ❌ No | Future phase |

---

## Modules Introduced

| Module | Role |
|--------|------|
| `ApiKeyModule` | Key generation, storage, listing |

---

## Key Generation Model

| Component | Format | Notes |
|-----------|--------|-------|
| Access Key | `UUID v4` | Publicly shareable identifier |
| Secret Key | `UUID v4` | Must be kept secret by the client |
| Storage (DB) | `accessKey` plain, `secretKey` AES-256-GCM encrypted | Never store secret in plaintext |
| Storage (Redis) | `apiKey:{accessKey}` → `{userId, secretKey}` | Fast lookup for auth |
| Status | Boolean, default `true` | Soft-delete via status flag |

---

## Data Model

### `UserApiKey` Table

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int (autoincrement) | Primary key |
| `userId` | Int | FK to `User` |
| `accessKey` | String (unique) | UUID v4, public identifier |
| `secretKey` | String | AES-256-GCM encrypted UUID v4 |
| `status` | Boolean | `true` = active |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Secret key exposure | Encrypted with AES-256-GCM in DB; only returned on creation, never again |
| Redis cache poisoning | Key stored as structured JSON; validated before use |
| Brute-force access key enumeration | Access keys are UUIDs (122-bit entropy) |
| Stale Redis entries | Cache should be invalidated on key revocation (when implemented) |
