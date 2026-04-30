# Module: Account Management – Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| AM.1 | OAuth Connect Flow | Meta Embedded Signup — token exchange, state, DB persist | `POST /connect`, state endpoints |
| AM.2 | WABA Listing | List WABAs from DB for authenticated user | `GET /wabas` |
| AM.3 | WABA Detail & Sync | Fetch WABA from Meta, sync to DB | `GET /wabas/:wabaId`, `POST /wabas/:wabaId/sync` |
| AM.4 | Phone Number Listing | List phone numbers for a WABA from DB | `GET /wabas/:wabaId/phone-numbers` |
| AM.5 | Phone Number Sync | Sync phone numbers from Meta to DB | `POST /wabas/:wabaId/phone-numbers/sync` |
| AM.6 | WABA Disconnect | Remove user-WABA association and optionally revoke token | `DELETE /wabas/:wabaId/connect` |
| AM.7 | Phone Number Registration | Register/deregister a phone number via Meta API | `POST /wabas/:wabaId/phone-numbers/:id/register` |

---

## Wave Detail

### Wave AM.1 – OAuth Connect Flow

| Task | Notes |
|------|-------|
| Generate and store OAuth state in Redis (TTL: 300s) | UUID state key |
| Exchange `code` for Meta access token | `POST /oauth/access_token` |
| Store encrypted token in `UserWhatsapp` | Upsert by `(userId, businessId)` |
| Return connected WABA IDs to client | For subsequent sync calls |
| Support business/WABA discovery from state | `GET /connect/businesses`, `/ownedWABAs`, `/clientWABAs` |
| Token debug endpoint | `POST /connect/debugToken` |

### Wave AM.2 – WABA Listing

| Task | Notes |
|------|-------|
| Query `Waba` table by `userId` | JWT auth required |
| Return `WabaResponseDto[]` | Include `wabaId`, `name`, `currency`, `timezoneId` |

### Wave AM.3 – WABA Detail & Sync

| Task | Notes |
|------|-------|
| `GET /wabas/:wabaId` | Fetch live detail from Meta Graph API |
| `POST /wabas/:wabaId/sync` | Fetch from Meta, upsert to DB |
| Use user's decrypted access token | Via `UserWhatsappService` |

### Wave AM.4 – Phone Number Listing

| Task | Notes |
|------|-------|
| Query `WabaPhoneNumber` by `wabaId` | Verify WABA belongs to user first |
| Return `WabaPhoneNumberResponseDto[]` | All fields from DB |

### Wave AM.5 – Phone Number Sync

| Task | Notes |
|------|-------|
| `POST /wabas/:wabaId/phone-numbers/sync` | Fetch from Meta, upsert all to DB |
| Upsert by `phoneNumberId` | Update all fields on conflict |

### Wave AM.6 – WABA Disconnect

| Task | Notes |
|------|-------|
| `DELETE /wabas/:wabaId/connect` | Remove `UserWhatsapp` record |
| Optionally call Meta to revoke token | Configurable behavior |

### Wave AM.7 – Phone Number Registration

| Task | Notes |
|------|-------|
| `POST /wabas/:wabaId/phone-numbers/:id/register` | Call Meta registration API |
| `DELETE /wabas/:wabaId/phone-numbers/:id/register` | Call Meta deregistration API |

---

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `META_APP_ID` | Meta application ID |
| `META_APP_SECRET` | Meta application secret |
| `META_REDIRECT_URI` | Redirect URI for OAuth flow |
