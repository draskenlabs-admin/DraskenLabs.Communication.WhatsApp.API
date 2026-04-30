# Phase 4 – WABA & Phone Numbers: Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| 4.1 | WABA DTOs | Define response DTOs for WABA and phone number data | `WabaResponseDto`, `WabaPhoneNumberResponseDto` |
| 4.2 | WabaService | Implement WABA list, Meta detail fetch, and DB upsert | `WabaService` |
| 4.3 | WabaController | Implement WABA endpoints with auth | 3 WABA endpoints live |
| 4.4 | WabaPhoneNumberService | Implement phone number list and sync from Meta | `WabaPhoneNumberService` |
| 4.5 | WabaPhoneNumberController | Implement phone number endpoints with auth | 2 phone number endpoints live |

---

## Wave Detail

### Wave 4.1 – WABA DTOs

| Task | Notes |
|------|-------|
| `WabaResponseDto` | `id`, `wabaId`, `name`, `currency`, `timezoneId`, `messageTemplateNamespace`, `userId`, `createdAt` |
| `WabaPhoneNumberResponseDto` | `id`, `phoneNumberId`, `verifiedName`, `displayPhoneNumber`, `qualityRating`, `platformType`, `throughputLevel`, `lastOnboardedTime`, `wabaId` |
| Swagger decorators on all fields | `@ApiProperty()` |

### Wave 4.2 – WabaService

| Task | Notes |
|------|-------|
| `findAllByUserId(userId)` | List all WABAs belonging to the authenticated user |
| `findByWabaId(wabaId, accessToken)` | Fetch WABA details from Meta Graph API |
| `upsert(wabaData, userId)` | Create or update `Waba` record in DB |
| Use user's decrypted access token | Retrieved via `UserWhatsappService` |

### Wave 4.3 – WabaController

| Task | Notes |
|------|-------|
| `GET /wabas` | List user's WABAs from DB — auth required |
| `GET /wabas/:wabaId` | Fetch live WABA detail from Meta — auth required |
| `POST /wabas/:wabaId/sync` | Sync WABA from Meta to DB — auth required |
| Swagger documentation | Document all endpoints and responses |

### Wave 4.4 – WabaPhoneNumberService

| Task | Notes |
|------|-------|
| `findAllByWabaId(wabaId)` | List phone numbers for a WABA from DB |
| `syncFromMeta(wabaId, accessToken)` | Fetch phone numbers from Meta, upsert all to DB |
| Validate WABA belongs to user | Check user has access before syncing |

### Wave 4.5 – WabaPhoneNumberController

| Task | Notes |
|------|-------|
| `GET /wabas/:wabaId/phone-numbers` | List phone numbers from DB — auth required |
| `POST /wabas/:wabaId/phone-numbers/sync` | Sync phone numbers from Meta — auth required |
| Swagger documentation | Document all endpoints and responses |

---

## Dependencies

| Dependency | Reason |
|-----------|--------|
| `UserWhatsappService` | Retrieve decrypted Meta access token for API calls |
| `PrismaService` | DB reads/writes for WABA and phone number records |
| Meta Graph API v25.0 | Source of WABA and phone number data |
