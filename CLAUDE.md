# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ShiftReady UI** — Next.js 16 / React 19 seller dashboard and public marketplace for the ShiftReady relocation platform.

- **Frontend** (`shiftready-ui/`): This repo. Seller-facing dashboard (live capture, inventory review, pricing, publishing) + public buyer marketplace.
- **Backend** (`../shiftready-backend/`): FastAPI service. Sibling directory. Launch with `--add-dir ../shiftready-backend` to edit both repos in one session.

Always launch Claude from the backend directory:
```
claude --add-dir ../shiftready-ui
```

Or from this directory:
```
claude --add-dir ../shiftready-backend
```

## Commands

```bash
npm run dev        # starts on http://localhost:3000
npm run lint
npm run build
```

Backend must be running on port 8080 for API calls to work locally.

## Architecture

### App Router Layout Groups

```
src/app/
├── page.tsx                       # Home / public browse (buyer-facing)
├── (auth)/                        # login, register — no sidebar
├── (sellers)/                     # Authenticated seller routes — shared sidebar + header
│   ├── create/page.tsx            # Legacy video upload entry
│   ├── dashboard/page.tsx         # Sales list
│   └── seller-central/
│       ├── page.tsx               # Seller hub
│       ├── capture/page.tsx       # Live capture (PRIMARY flow)
│       ├── live-stream/page.tsx
│       ├── create/page.tsx        # Upload entry
│       └── inventory/[eventId]/page.tsx   # Inventory review cockpit
└── (public)/
    └── sale/[eventId]/page.tsx    # Public sale detail (buyer-facing)
```

### Component Structure

```
src/components/features/
├── capture/          # CaptureStage, CaptureBucket, ItemConfirmCard,
│                     # CapturePermissionsGate, CaptureControls, CaptureOverlay,
│                     # ItemReviewScreen, FinalizeCaptureDialog
├── create/           # upload-screen, processing-screen (batch + live modes),
│                     # video-uploader, how-to, step-header, upload-progress-bar
├── inventory/        # inventory-card, card-pricing-grid, card-identity,
│                     # video-panel, loading-overlay, bundle-section,
│                     # inventory-actions, AppendVideoModal, item-photo-strip
├── seller-central/   # sale-row, bundle-card, item-card-v2
├── dashboard/        # sale-card
└── marketplace/      # marketplace-item-card, bundle-card
```

### Hooks (`src/hooks/`)

- `use-auth.ts` — Firebase auth state
- `use-sales.ts` — TanStack Query: list + status
- `use-upload.ts` — video upload state machine
- `use-append-upload.ts` — append video to existing sale
- `use-websocket.ts` — WebSocket lifecycle + reconnect (reused by inventory)
- `use-landing.ts` — public home page data

### Lib (`src/lib/`)

- `api.ts` — ALL API calls live here. Single `apiRequest<T>()` wrapper.
- `types.ts` — `InventoryItem`, `RoomBundle`, `SaleSummary`, `InventoryImage`
- `firebase.ts` — Firebase client SDK init
- `schemas.ts` — Zod schemas for forms
- `utils.ts` — `cn()` = clsx + tailwind-merge
- `capture/mediapipe-loader.ts` — lazy-load WASM, init ObjectDetector (~5MB, dynamic import)
- `capture/capture-types.ts` — `CapturedItem`, `PendingDetection`, `CaptureToast`, `dataUrlToFile`, `blobToFile`

## Key Flows

### Live Capture (Primary — `/seller-central/capture`)

1. `CapturePermissionsGate` — request camera (required) + mic (optional, Phase 5)
2. `CaptureStage` — `getUserMedia` + MediaPipe ObjectDetector on-device
3. Per detected item: `ItemConfirmCard` → user confirms → `runCaptureFrame()`:
   - POST `/sales/{id}/capture/frame` with JPEG
   - Gemini single-frame identify → `{name, brand, predicted_original_price, gcs_uri}`
   - Updates `confirmedItems` state; `frameSrc` (dataUrl) kept for thumbnail display
4. "Finish" → `ItemReviewScreen` — review/remove; shows all confirmed items
5. "Upload & Process" → `handleProcess()`:
   - Calls `finalizeCaptureV2(eventId, analyzedItems)` — sends pre-analyzed items, not raw frames
   - Fallback to `processFrames()` if all `captureFrame` calls failed
6. `ProcessingScreen` with `mode="live"` and `capturedItems` prop
7. Polls `getStatus()` every 3s → redirects to `/seller-central/inventory/${eventId}`

### Video Upload (Secondary/Fallback — `/seller-central/create`)

1. `UploadScreen` — drag-drop or file-pick
2. `initSale()` → signed PUT URL → XHR upload to GCS
3. `startProcessing()` → backend extraction pipeline starts
4. `ProcessingScreen` with `mode="batch"` — animated fake item ticker
5. Same poll → redirect to inventory

### Inventory Cockpit (`/seller-central/inventory/[eventId]`)

- `useInventory(eventId)` — WebSocket + fallback polling (1500ms during processing/pricing)
- Auto-refetch summary when status transitions from processing → ready
- `LoadingOverlay` during processing or pricing states
- CRUD mutations (bundle add/delete, item update/delete, publish, re-estimate) all invalidate queries

## ProcessingScreen

Two modes, one component:

```tsx
<ProcessingScreen
  eventId={id}
  uploadedFile={null}
  mode="live"              // "batch" | "live"
  capturedItems={items}    // CapturedItem[] — only for live mode
/>
```

- `batch`: animated orb + fake discovery ticker (video flow — items unknown)
- `live`: real item list with `frameSrc` thumbnails + "Pricing…" status badge

Both modes share: same polling `useEffect`, same `goToDashboard`/`stayAndWatch` CTAs.

## API Client (`src/lib/api.ts`)

- Base URL: `NEXT_PUBLIC_API_URL` env var → fallback to Cloud Run URL
- Auth: module-level `_idToken` set by `AuthProvider`; auto-injected via `setAuthToken()`
- `apiRequest<T>(url, init)` — parses errors from FastAPI `detail` field, handles 204
- Key capture functions: `initCaptureSale`, `captureFrame`, `finalizeCaptureV2`, `finalizeCapture` (legacy), `processFrames` (fallback)

## TanStack Query Conventions

- Single `QueryClient` in `providers.tsx` with default config
- Polling: conditional, 1500ms only during `processing` / `pricing_in_progress`
- Mutations: `queryClient.invalidateQueries` on success
- `staleTime: 5 * 60 * 1000` for data stable during AI processing

## Design System

- **Dark-only** — `<html className="dark">` hardcoded; no light mode planned
- **Tailwind v4** — `@theme {}` block in `src/app/globals.css`; no `tailwind.config.js`
- **Layout constraint**: main content always has `pl-64` (sidebar) + `pt-16` (header); don't override on new pages
- **Key design tokens** (Tailwind classes):
  - `bg-surface`, `bg-surface-container-low/high/lowest/highest`
  - `text-on-surface`, `text-on-surface-variant`
  - `text-primary` — #adc6ff electric blue (CTAs, links)
  - `text-tertiary` — #4edea3 green (pricing, positive values)
  - `border-outline`, `border-outline-variant`
- **Icons**: lucide-react only — never introduce other icon libraries
- **Class merging**: `cn()` from `lib/utils.ts` for all conditional class strings

## Adding New Features

**New page:**
1. `src/app/<route>/page.tsx`
2. API calls → `src/lib/api.ts`
3. Types → `src/lib/types.ts`
4. Data hook → `src/hooks/` with TanStack Query

**New API call:**
Follow pattern in `api.ts` — use `apiRequest<ReturnType>`, add named export, add TypeScript interface for request/response.

**New component:**
Put in `src/components/features/<feature>/` — match existing filename casing (kebab-case for create/inventory, PascalCase for capture).

## Authentication

- Firebase Client SDK (`firebase.ts`)
- `use-auth.ts` + `AuthProvider` manage token lifecycle
- Token auto-injected in all `apiRequest` calls via `_idToken`
- Backend auth bypass active locally when `K_SERVICE` absent (`dev_` prefix tokens)
- Full Firebase integration: `FRONTEND_AUTH_INTEGRATION.md` in backend repo

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:8080   # local backend
```

Production value baked at Docker build time via `--build-arg`.
