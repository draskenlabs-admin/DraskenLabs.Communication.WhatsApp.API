# Module: Templates – Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| T.1 | DB Schema | Add `MessageTemplate` model and enums to Prisma | Migration, updated Prisma client |
| T.2 | Template DTOs | Define request/response DTOs for all template operations | Create, response, component DTOs |
| T.3 | Template Listing | List templates from Meta, sync to DB | `GET /wabas/:wabaId/templates` |
| T.4 | Template Creation | Submit template to Meta, persist pending record | `POST /wabas/:wabaId/templates` |
| T.5 | Template Detail | Retrieve single template from DB | `GET /wabas/:wabaId/templates/:id` |
| T.6 | Template Deletion | Delete template via Meta API, remove from DB | `DELETE /wabas/:wabaId/templates/:id` |
| T.7 | Status Sync | Sync template approval statuses from Meta | `POST /wabas/:wabaId/templates/sync` |

---

## Wave Detail

### Wave T.1 – DB Schema

| Task | Notes |
|------|-------|
| Add `MessageTemplate` model | All fields as per definition |
| Add `TemplateCategory` enum | `MARKETING`, `UTILITY`, `AUTHENTICATION` |
| Add `TemplateStatus` enum | `PENDING`, `APPROVED`, `REJECTED`, `DISABLED`, `IN_APPEAL`, `DELETED` |
| Run migration | `prisma migrate dev --name add_message_template` |

### Wave T.2 – Template DTOs

| DTO | Fields | Notes |
|-----|--------|-------|
| `CreateTemplateDto` | `name`, `category`, `language`, `components[]` | Validated component structure |
| `TemplateComponentDto` | `type`, `format?`, `text?`, `buttons?`, `example?` | Discriminated by `type` |
| `TemplateButtonDto` | `type`, `text`, `url?`, `phoneNumber?`, `otpType?` | Per button type |
| `TemplateResponseDto` | All `MessageTemplate` fields | DB record shape |

### Wave T.3 – Template Listing

| Task | Notes |
|------|-------|
| `GET /wabas/:wabaId/templates` | Query DB for templates by `wabaId` |
| Support filter by `status`, `category` | Query params |
| Pagination support | `page`, `limit` |
| Verify WABA belongs to user | Authorization check |

### Wave T.4 – Template Creation

| Task | Notes |
|------|-------|
| `POST /wabas/:wabaId/templates` | Validate DTO, call Meta API |
| Persist with `status: PENDING` | Await Meta approval |
| Return `TemplateResponseDto` | Include Meta template ID |

### Wave T.5 – Template Detail

| Task | Notes |
|------|-------|
| `GET /wabas/:wabaId/templates/:id` | Look up by internal or Meta ID |
| Return latest status from DB | Not a live Meta call — use sync endpoint for refresh |

### Wave T.6 – Template Deletion

| Task | Notes |
|------|-------|
| `DELETE /wabas/:wabaId/templates/:id` | Call Meta delete, set `status: DELETED` in DB |
| Soft delete in DB | Keep record for audit |

### Wave T.7 – Status Sync

| Task | Notes |
|------|-------|
| `POST /wabas/:wabaId/templates/sync` | Fetch all templates from Meta |
| Upsert status and `rejectedReason` | Update existing DB records |
| Handle paginated Meta response | Fetch all pages |

---

## Dependencies

| Dependency | Reason |
|-----------|--------|
| `UserWhatsappService` | Retrieve decrypted Meta access token |
| `WabaService` | Verify WABA belongs to user |
| `PrismaService` | Persist and query `MessageTemplate` records |
