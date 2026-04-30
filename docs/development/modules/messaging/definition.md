# Module: Messaging – Definition

## Purpose

Provides the core WhatsApp message sending capability of the platform. Enables authenticated clients to send outbound messages to WhatsApp users via the Meta Cloud API, supporting all WhatsApp message types: text, media (image, video, audio, document), interactive messages, reactions, location, contacts, and template-based messages.

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| Send text messages | ✅ Yes | — |
| Send media messages (image, video, audio, document) | ✅ Yes | — |
| Send template messages | ✅ Yes | — |
| Send interactive messages (buttons, lists) | ✅ Yes | — |
| Send location messages | ✅ Yes | — |
| Send reaction messages | ✅ Yes | — |
| Send contact card messages | ✅ Yes | — |
| Message status tracking (sent, delivered, read) | ✅ Yes | Via Webhooks module |
| Bulk/batch messaging | ❌ No | Future |
| Scheduled messaging | ❌ No | Future |
| Conversation thread management | ❌ No | Future |

---

## Message Types

| Type | Meta Type Value | Description |
|------|----------------|-------------|
| Text | `text` | Plain text with optional URL preview |
| Image | `image` | JPEG/PNG image with optional caption |
| Video | `video` | MP4 video with optional caption |
| Audio | `audio` | MP3/OGG audio |
| Document | `document` | PDF/DOCX/XLSX with filename and caption |
| Template | `template` | Pre-approved message template with parameters |
| Interactive (Buttons) | `interactive` | Up to 3 quick-reply buttons |
| Interactive (List) | `interactive` | Menu list with up to 10 items |
| Location | `location` | Latitude, longitude, name, address |
| Reaction | `reaction` | Emoji reaction to a previous message |
| Contacts | `contacts` | vCard contact information |

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/messages` | API Key / JWT | Send a message |
| GET | `/messages/:messageId` | API Key / JWT | Get message status |
| GET | `/messages` | API Key / JWT | List messages with filters |

---

## Meta API Integration

| Operation | Meta Endpoint | Notes |
|-----------|--------------|-------|
| Send message | `POST /{phoneNumberId}/messages` | Requires phone number's access token |
| Mark as read | `PUT /{phoneNumberId}/messages` | Send read receipts |

---

## Message Payload Structure

| Field | Required | Description |
|-------|----------|-------------|
| `to` | ✅ Yes | Recipient phone number (E.164 format) |
| `type` | ✅ Yes | Message type (`text`, `image`, `template`, etc.) |
| `phoneNumberId` | ✅ Yes | Sending phone number ID |
| `[type]` | ✅ Yes | Type-specific payload object |
| `context.messageId` | ❌ No | Reply-to message ID |

---

## Data Model (Planned)

| Table | Purpose |
|-------|---------|
| `Message` | Outbound message record with status tracking |

### `Message` Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | PK, autoincrement |
| `metaMessageId` | String | Meta-assigned message ID |
| `phoneNumberId` | String | Sending phone number |
| `to` | String | Recipient number |
| `type` | Enum | Message type |
| `payload` | JSON | Full message payload |
| `status` | Enum | `sent`, `delivered`, `read`, `failed` |
| `userId` | Int | FK → User |
| `createdAt` | DateTime | Send time |
| `updatedAt` | DateTime | Last status update |
