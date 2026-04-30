# Module: Contacts – Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| C.1 | DB Schema | Add `Contact` model to Prisma schema | Migration, Prisma client |
| C.2 | Contact DTOs | Define request/response DTOs | Create, update, response, import DTOs |
| C.3 | Contact CRUD | Create, read, update, delete contacts | Core CRUD endpoints |
| C.4 | Contact Listing | List with search, filter, and pagination | `GET /contacts` with query params |
| C.5 | Opt-Out Management | Track and enforce contact opt-outs | Opt-out endpoints, guard in Messaging |
| C.6 | Number Validation | Validate contact numbers via Meta API | `GET /contacts/:id/validate` |
| C.7 | Bulk Import | CSV import of contacts | `POST /contacts/import` |
| C.8 | Tag Management | Add and remove tags on contacts | Tag operations on `PATCH /contacts/:id` |

---

## Wave Detail

### Wave C.1 – DB Schema

| Task | Notes |
|------|-------|
| Add `Contact` model | All fields as per definition |
| Add unique constraint on `(userId, phoneNumber)` | Prevent duplicate contacts per user |
| Run migration | `prisma migrate dev --name add_contact` |

### Wave C.2 – Contact DTOs

| DTO | Fields | Notes |
|-----|--------|-------|
| `CreateContactDto` | `phoneNumber`, `firstName?`, `lastName?`, `email?`, `tags?`, `metadata?` | `phoneNumber` required |
| `UpdateContactDto` | Partial of `CreateContactDto` | All fields optional |
| `ContactResponseDto` | All `Contact` fields | DB record shape |
| `ImportContactsDto` | CSV file | Multipart upload |
| `ContactQueryDto` | `search`, `tags`, `isOptedOut`, `isValid`, `page`, `limit` | Query params |

### Wave C.3 – Contact CRUD

| Task | Notes |
|------|-------|
| `POST /contacts` | Create contact for authenticated user |
| `GET /contacts/:id` | Get by internal ID, verify ownership |
| `PUT /contacts/:id` | Update fields, verify ownership |
| `DELETE /contacts/:id` | Soft-delete (`status: false`) |

### Wave C.4 – Contact Listing

| Task | Notes |
|------|-------|
| `GET /contacts` | Paginated list for authenticated user |
| Filter by `tags` | Array intersection |
| Filter by `isOptedOut`, `isValid` | Boolean filters |
| Full-text search on `phoneNumber`, `firstName`, `lastName` | `WHERE ... ILIKE` |
| Return `meta` with total count | Standard pagination |

### Wave C.5 – Opt-Out Management

| Task | Notes |
|------|-------|
| `POST /contacts/:id/opt-out` | Set `isOptedOut: true` |
| `DELETE /contacts/:id/opt-out` | Set `isOptedOut: false` |
| Guard in Messaging module | Block send if `isOptedOut: true` |
| Webhook integration | Auto opt-out on "STOP" keyword |

### Wave C.6 – Number Validation

| Task | Notes |
|------|-------|
| `GET /contacts/:id/validate` | Call Meta API to check if number is on WhatsApp |
| Update `waId` and `isValid` in DB | Store Meta's `wa_id` for valid numbers |
| Return validation result | `{ isValid, waId }` |

### Wave C.7 – Bulk Import

| Task | Notes |
|------|-------|
| Accept CSV upload | Columns: `phoneNumber`, `firstName`, `lastName`, `email`, `tags` |
| Parse and validate each row | Return per-row errors |
| Upsert contacts in batch | `createMany` with `skipDuplicates` |
| Return import summary | `{ total, created, updated, failed }` |

### Wave C.8 – Tag Management

| Task | Notes |
|------|-------|
| Add tags via `PUT /contacts/:id` | Merge or replace tags array |
| Filter contacts by tag | `GET /contacts?tags=vip,customer` |

---

## Dependencies

| Dependency | Reason |
|-----------|--------|
| `MessagingService` | Opt-out check before sending |
| `WebhooksService` | Auto-opt-out on STOP keyword |
| Meta Graph API | Phone number validation |
| `PrismaService` | Contact persistence |
