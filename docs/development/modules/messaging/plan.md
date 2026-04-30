# Module: Messaging – Plan

## Waves

| Wave | Name | Description | Deliverables |
|------|------|-------------|-------------|
| M.1 | DB Schema | Add `Message` model to Prisma schema | Migration, updated Prisma client |
| M.2 | Message DTOs | Define request/response DTOs for all message types | Send DTOs, response DTO |
| M.3 | Text Messaging | Send plain text messages via Meta API | `POST /messages` (text type) |
| M.4 | Media Messaging | Send image, video, audio, document messages | `POST /messages` (media types) |
| M.5 | Template Messaging | Send pre-approved template messages with parameters | `POST /messages` (template type) |
| M.6 | Interactive Messaging | Send button and list interactive messages | `POST /messages` (interactive type) |
| M.7 | Other Message Types | Location, reaction, contact card messages | `POST /messages` (remaining types) |
| M.8 | Message Status | Retrieve message status by Meta message ID | `GET /messages/:messageId` |
| M.9 | Message Listing | List sent messages with filter/pagination | `GET /messages` |
| M.10 | Read Receipts | Mark messages as read via Meta API | Internal call on webhook event |

---

## Wave Detail

### Wave M.1 – DB Schema

| Task | Notes |
|------|-------|
| Add `Message` model to `schema.prisma` | `metaMessageId`, `phoneNumberId`, `to`, `type`, `payload` (JSON), `status`, `userId` |
| Add `MessageStatus` enum | `sent`, `delivered`, `read`, `failed` |
| Add `MessageType` enum | `text`, `image`, `video`, `audio`, `document`, `template`, `interactive`, `location`, `reaction`, `contacts` |
| Run migration | `prisma migrate dev --name add_message` |

### Wave M.2 – Message DTOs

| DTO | Fields | Notes |
|-----|--------|-------|
| `SendMessageDto` | `to`, `type`, `phoneNumberId`, `context?`, `[type payload]` | Discriminated union per type |
| `TextPayloadDto` | `body`, `previewUrl?` | — |
| `MediaPayloadDto` | `id?`, `link?`, `caption?`, `filename?` | ID or link required |
| `TemplatePayloadDto` | `name`, `language`, `components[]` | Template name and params |
| `InteractivePayloadDto` | `type`, `body`, `action` | Buttons or list |
| `MessageResponseDto` | `messageId`, `status`, `to`, `createdAt` | Send confirmation |

### Wave M.3 – Text Messaging

| Task | Notes |
|------|-------|
| Build `POST /messages` with `type: text` | Validate `body` field |
| Call Meta `/{phoneNumberId}/messages` | Pass user access token |
| Persist `Message` record to DB | Initial status: `sent` |
| Return `MessageResponseDto` | Include Meta `messageId` |

### Wave M.4 – Media Messaging

| Task | Notes |
|------|-------|
| Extend `POST /messages` to handle media types | `image`, `video`, `audio`, `document` |
| Support both media ID and hosted URL | `id` or `link` in payload |
| Validate file type constraints | Per Meta's supported formats |

### Wave M.5 – Template Messaging

| Task | Notes |
|------|-------|
| Extend `POST /messages` with `type: template` | `name`, `language`, `components` |
| Support header, body, footer, button components | As per Meta template spec |
| Validate template exists | Optional: check via Templates module |

### Wave M.6 – Interactive Messaging

| Task | Notes |
|------|-------|
| Button messages | Up to 3 quick-reply buttons |
| List messages | Up to 10 rows across sections |
| CTA URL buttons | Single call-to-action URL |

### Wave M.7 – Other Message Types

| Task | Notes |
|------|-------|
| Location | `latitude`, `longitude`, `name`, `address` |
| Reaction | `messageId`, `emoji` |
| Contacts | vCard array |

### Wave M.8 – Message Status

| Task | Notes |
|------|-------|
| `GET /messages/:messageId` | Look up by internal ID or `metaMessageId` |
| Return current status from DB | Updated by webhook events |

### Wave M.9 – Message Listing

| Task | Notes |
|------|-------|
| `GET /messages` | Filter by `phoneNumberId`, `to`, `type`, `status`, date range |
| Pagination | `page`, `limit` query params |
| Return `meta` with total count | Standard `BaseResponse` pagination |

### Wave M.10 – Read Receipts

| Task | Notes |
|------|-------|
| `PUT /{phoneNumberId}/messages` | Call when message status = `read` from webhook |
| Triggered by Webhooks module | Internal service call, not exposed endpoint |

---

## Dependencies

| Dependency | Reason |
|-----------|--------|
| `UserWhatsappService` | Retrieve decrypted Meta access token for API calls |
| Webhooks module | Updates message status on delivery/read events |
| `PrismaService` | Persist and query `Message` records |
