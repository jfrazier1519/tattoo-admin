## Tattoo Website -> Admin Handoff Summary (Current State)

### What is already implemented (website repo)

- Website now uses **Firestore-first with static fallback** for content loading.
- Firestore-backed content currently read from:
  - `contentBlocks`
  - `placements`
  - `portfolioItems`
- Forms now write real appointment records to:
  - `appointments`
- One-time migration utility exists and has been run successfully:
  - `src/scripts/migrateStaticContentToFirestore.js`
  - Seeded counts observed:
    - `placements`: 24
    - `portfolioItems`: 6
    - `contentBlocks`: 6 (includes events block)
- Firestore rules were updated/deployed to allow MVP collection access for:
  - `contentBlocks`, `placements`, `portfolioItems`, `appointments`, `mediaAssets`, `_migrations`

---

## Collections Admin Should Manage First

1. `contentBlocks`
2. `placements`
3. `portfolioItems`
4. `mediaAssets` (upload flow can come right after CRUD for above)
5. `appointments` (management view/filtering)

---

## Data Contract (must match exactly)

### `contentBlocks`
Required:
- `slotKey` (string, unique)
- `pageKey` (string)
- `blockType` (string)
- `isPublished` (boolean)
- `updatedAt` (timestamp)

Optional:
- `title` (string)
- `body` (string)
- `payload` (map/object)
- `mediaAssetIds` (array<string>)
- `placementIds` (array<string>)
- `sortOrder` (number)
- `createdAt` (timestamp)

Current seeded examples:
- `home.hero`
- `home.featuredWork`
- `requestQuoteSection`
- `gallery`
- `contact`
- `eventsPage`

---

### `placements`
Required:
- `id` (string slug)
- `label` (string)
- `type` (enum string)

Enum `type` values:
- `bodyLocation`
- `style`
- `tattooType`
- `galleryCategory`
- `displaySlot` (optional use)

Optional:
- `sortOrder` (number)
- `isActive` (boolean)

---

### `portfolioItems`
(website reads these into gallery grid)

Expected fields:
- `title` (string)
- `category` (string)
- `image` (string URL/path)
- `description` (string, optional)
- `sortOrder` (number, optional)
- `isPublished` (boolean)

---

### `appointments`
Website writes these now from Contact/Quote forms.

Required shape in plan:
- `clientId`, `name`, `contact`, `description`
- `date`, `duration`, `status`
- `notes`, `calendarEventId`, `createdAt`

Website currently writes `status: "new"` and includes `source` + `details` metadata.

---

## Admin UX / Validation Requirements

- Use controlled inputs for enums (`placements.type`, category values, etc.).
- Preserve editorial fields:
  - `isPublished`
  - `sortOrder`
- Do not rename contract fields.
- Prefer upsert-safe writes (merge where appropriate) and avoid schema drift.

---

## Priority Build Order for Admin (recommended)

1. Firebase init + shared contract constants
2. `contentBlocks` CRUD (slot-driven editing)
3. `placements` CRUD
4. `portfolioItems` CRUD
5. `mediaAssets` upload -> Storage + metadata doc
6. `appointments` list/filter/update status

---

## Notes

- Website is **not Firestore-only yet** globally; it is Firestore-first + static fallback.
- Only sections mapped/seeded in `contentBlocks` are admin-editable through Firestore today.
- Events are included via `contentBlocks/events_page` (`slotKey: "eventsPage"`).
