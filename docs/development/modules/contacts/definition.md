# Module: Contacts – Definition

## Purpose

Manages the directory of WhatsApp contacts (recipients) that the platform communicates with. Provides the ability to create, update, list, and manage contacts associated with a user's account, enabling personalized messaging, opt-out tracking, and conversation history lookup. Serves as the recipient data layer for the Messaging module.

---

## Scope

| Area | Included | Excluded |
|------|----------|----------|
| Create and update contacts | ✅ Yes | — |
| List contacts with search and filter | ✅ Yes | — |
| Get contact detail | ✅ Yes | — |
| Delete / deactivate contacts | ✅ Yes | — |
| Opt-out / block tracking | ✅ Yes | — |
| Contact tags and grouping | ✅ Yes | — |
| Bulk contact import (CSV) | ✅ Yes | — |
| WhatsApp phone number validation | ✅ Yes | Via Meta API |
| Contact message history | ❌ No | Messaging module handles this |
| CRM integrations (HubSpot, Salesforce) | ❌ No | Future |
| Contact segmentation for campaigns | ❌ No | Future |

---

## Key Entities

| Entity | Description |
|--------|-------------|
| `Contact` | A WhatsApp recipient with phone number and profile metadata |
| `ContactTag` | Label/tag applied to a contact for grouping |
| `ContactOptOut` | Record of a contact opting out of messages |

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/contacts` | JWT / API Key | Create a new contact |
| GET | `/contacts` | JWT / API Key | List contacts with search/filter/pagination |
| GET | `/contacts/:id` | JWT / API Key | Get contact detail |
| PUT | `/contacts/:id` | JWT / API Key | Update contact information |
| DELETE | `/contacts/:id` | JWT | Delete / deactivate a contact |
| POST | `/contacts/import` | JWT | Bulk import contacts from CSV |
| POST | `/contacts/:id/opt-out` | JWT / API Key | Mark contact as opted out |
| DELETE | `/contacts/:id/opt-out` | JWT | Remove opt-out (re-subscribe) |
| GET | `/contacts/:id/validate` | JWT | Validate WhatsApp number via Meta API |

---

## Data Model (Planned)

### `Contact` Table

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | PK, autoincrement |
| `userId` | Int | FK → User |
| `phoneNumber` | String | E.164 format |
| `firstName` | String? | — |
| `lastName` | String? | — |
| `email` | String? | — |
| `waId` | String? | Meta-verified WhatsApp ID |
| `isValid` | Boolean | WhatsApp number validated |
| `isOptedOut` | Boolean | Opt-out status |
| `tags` | String[] | Array of tag labels |
| `metadata` | JSON? | Custom key-value pairs |
| `status` | Boolean | Active/inactive |
| `createdAt` | DateTime | — |
| `updatedAt` | DateTime | — |

---

## Contact Opt-Out Handling

| Trigger | Action |
|---------|--------|
| User sends "STOP" keyword | Webhooks module flags contact as opted-out |
| Manual opt-out via API | `POST /contacts/:id/opt-out` |
| Messaging blocked | System checks `isOptedOut` before sending |
| Re-subscribe | User sends "START" keyword or manual re-enable |
