# Tattoo Tools Implementation Plan (Source of Truth)

This document keeps the website repo and admin repo aligned while we build features.

## Build Order (What goes first)

1. **Website data contract first**
   - Define and lock Firestore collection names and field shapes.
   - Add read-paths in website with static fallback during migration.
   - Why first: the public site is the runtime consumer, so it should define the minimum contract that must not break.

2. **Admin second**
   - Build CRUD and upload flows to write data that matches the website contract exactly.
   - Add management UX (filters, placement tags, publishing toggles).

3. **Switch-over**
   - Migrate section-by-section from static content to Firestore.
   - Remove fallback only after each section is verified in production-like data.

## MVP Scope (Current)

- Booking system end-to-end.
- Admin manages clients + appointments.
- Content/media management for website.
- Storage-backed uploads with metadata in Firestore.

## Explicitly Out of Scope (for now)

- Payments
- Messaging
- Advanced calendar UI
- Two-way Google Calendar sync
- Calendar work before Phase 7

## Firestore Collections (MVP)

## 1) `mediaAssets`

Use for uploaded images/files and reusable media references.

Required fields:
- `storagePath` (string)
- `downloadURL` (string)
- `kind` (string: `image` for now)
- `createdAt` (timestamp)

Optional fields:
- `alt` (string)
- `width` (number)
- `height` (number)
- `tags` (array of string)
- `isPublished` (boolean, default `true`)
- `updatedAt` (timestamp)

## 2) `placements`

Taxonomy used by forms, gallery filters, and admin filtering.

Required fields:
- `id` (string slug; can match document ID)
- `label` (string)
- `type` (string enum)

Enum `type` values:
- `bodyLocation`
- `style`
- `tattooType`
- `galleryCategory`
- `displaySlot` (optional if we keep slot metadata here)

Optional fields:
- `sortOrder` (number)
- `isActive` (boolean, default `true`)

## 3) `contentBlocks`

Controls where content appears on the site with explicit slot keys.

Required fields:
- `slotKey` (string, unique; example: `home.hero`)
- `pageKey` (string; example: `home`, `gallery`)
- `blockType` (string; example: `hero`, `galleryGrid`, `cta`)
- `isPublished` (boolean)
- `updatedAt` (timestamp)

Optional fields:
- `title` (string)
- `body` (string)
- `payload` (map/object for custom per-block data)
- `mediaAssetIds` (array of strings)
- `placementIds` (array of strings)
- `sortOrder` (number)
- `createdAt` (timestamp)

## 4) `appointments` (already in project spec)

Required shape:
- `clientId`, `name`, `contact`, `description`
- `date`, `duration`, `status`
- `notes`, `calendarEventId`, `createdAt`

Calendar fields should exist now but Google Calendar behavior remains Phase 7.

## Admin UX Model (visual management)

Use both:
- **Slots/blocks**: explicit page placement (`slotKey`) for visual control.
- **Tags/placements**: taxonomy for filtering and reusable grouping.

Why:
- Tags alone become ambiguous for "where does this show?"
- Slots alone become rigid without filter/tag metadata.
- Combined approach is easiest for a non-technical content manager.

## Storage + Upload Flow

1. Upload file to Firebase Storage.
2. Create `mediaAssets` document with storage metadata + URL.
3. In `contentBlocks` editor, attach media by selecting `mediaAssetIds`.
4. Website resolves media by IDs and renders blocks by `slotKey`.

## Website Integration Rules

- Firestore is source of truth.
- Keep service layer abstraction (no direct Firestore in UI components if avoidable).
- During migration, read Firestore first and fallback to static content.
- Remove fallback after each section is validated.

## Admin Integration Rules

- Admin writes must strictly match contract field names and enums.
- Prefer controlled inputs for enum values to avoid drift.
- Preserve `isPublished` and `sortOrder` controls for editorial workflow.

## Suggested Milestone Sequence

1. Finalize this document (schema + enums + slotKey naming).
2. Website: add Firebase client + read service for Firestore content.
3. Website: implement Firestore-first, static-fallback reads.
4. Admin: implement Storage uploads -> `mediaAssets`.
5. Admin: implement `placements` CRUD.
6. Admin: implement `contentBlocks` CRUD with media linking.
7. One-time migration script from static content to Firestore.
8. Validate parity on Home/Gallery/Contact.
9. Remove static fallback for migrated sections.
10. Move to booking + appointments hardening.

## Change Control

Before changing schema:
1. Update this file first.
2. Update website read/write services.
3. Update admin forms and validation.
4. Then migrate data if needed.

If a proposed field is not documented here, treat it as non-contract until approved.
