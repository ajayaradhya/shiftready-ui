# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## Project Overview

**Myrio UI** — Turborepo monorepo containing the web app and native mobile app for the Myrio relocation platform.

- **Web** (`apps/web/`): Next.js 16 / React 19 seller dashboard + buyer marketplace.
- **Mobile** (`apps/mobile/`): Expo 54 / React Native 0.81.5 native app.
- **Shared packages**: `@myrio/api` · `@myrio/core` · `@myrio/types`.
- **Backend** (`../shiftready-backend/`): FastAPI on Cloud Run. Sibling directory.

Package manager: **pnpm 10** with Turborepo. Run `pnpm install` at root.

Launch with both repos editable:

```
claude --add-dir ../shiftready-backend
# or, from backend
claude --add-dir ../shiftready-ui
```

## Commands

```bash
# Root — via Makefile or pnpm
make web-dev          # http://localhost:3000 (or: pnpm dev)
make web-build        # production build
make web-lint         # lint web workspace
make mobile-start     # Expo dev server (Metro / Expo Go)
make mobile-android   # build + run on Android
make mobile-ios       # build + run on iOS (macOS only)
make install          # install all workspace deps (pnpm install)
make clean            # nuke node_modules + reinstall

# Web via pnpm directly
pnpm --filter @myrio/web dev
pnpm --filter @myrio/web build
pnpm lint
pnpm type-check       # tsc --noEmit

# Mobile via pnpm directly
pnpm --filter @myrio/mobile start
pnpm --filter @myrio/mobile android
pnpm --filter @myrio/mobile ios
pnpm --filter @myrio/mobile prebuild   # expo prebuild --clean
```

Backend must be running on port 8080 for API calls to work locally.

## Architecture

### Monorepo Structure

```
shiftready-ui/
├── apps/
│   ├── web/                       # Next.js 16 App Router (@myrio/web)
│   │   └── src/app/
│   │       ├── layout.tsx         # Providers + Shell
│   │       ├── page.tsx           # Landing
│   │       ├── (auth)/            # login · register — bare layout
│   │       ├── (sellers)/         # Authenticated seller routes
│   │       │   ├── seller-central/ # Hub · capture · create
│   │       │   ├── inventory/[eventId]/
│   │       │   ├── messages/
│   │       │   └── settings/      # Profile · Account · Contact · Notifs · Prefs · Privacy
│   │       ├── (market)/          # Buyer marketplace
│   │       └── (public)/          # Anonymous sale view
│   └── mobile/                    # Expo / React Native (@myrio/mobile)
│       └── app/
│           ├── (auth)/            # login · register
│           ├── (tabs)/            # Market · Saved · Messages · Sell · Profile
│           ├── capture/           # Camera capture flow
│           ├── sale/[eventId]/    # Sale detail
│           ├── item/[eventId]/[bundleId]/[itemId]/
│           ├── conversation/[convId]/
│           ├── seller/inventory/[eventId]/
│           ├── notifications/
│           └── purchases/
└── packages/                      # Shared workspace packages
    ├── @myrio/api             # Shared API client (configure({ apiBaseUrl }))
    ├── @myrio/core            # Shared utilities (SYDNEY_SUBURBS, suburbsForPostcode, etc.)
    └── @myrio/types           # Shared TypeScript types (NotifPrefs, SellerPrefs, PrivacyPrefs, …)
```

### Web Component Structure (`apps/web/src/`)

```
components/
├── providers.tsx                  # QueryClientProvider + AuthProvider + ReactQueryDevtools
├── shell/
│   ├── header.tsx                 # Slim 48px header (⌘K trigger)
│   ├── sidebar.tsx                # Icon-rail w/ hover-expand
│   ├── command-palette.tsx        # ⌘K (cmdk)
│   ├── notifications-panel.tsx    # Right slide-over
│   ├── profile-menu.tsx           # Radix popover (includes Google SSO status)
│   ├── bottom-tab-bar.tsx         # Mobile tabs
│   └── shortcuts-cheatsheet.tsx
├── ui/                            # Radix primitives (button, dialog, sheet, dropdown, tooltip, badge, input, label)
└── features/
    ├── capture/                   # CaptureStage, ItemConfirmCard, ItemReviewScreen,
    │                              # CapturePermissionsGate, CaptureControls, CaptureOverlay,
    │                              # FinalizeCaptureDialog
    ├── create/                    # upload-screen, processing-screen (batch + live),
    │                              # video-uploader, how-to, step-header, upload-progress-bar
    ├── inventory/                 # inventory-card, card-pricing-grid, card-identity,
    │                              # video-panel, loading-overlay, bundle-section,
    │                              # inventory-actions, AppendVideoModal, item-photo-strip
    ├── seller-central/            # sale-row, bundle-card, item-card-v2
    ├── dashboard/                 # sale-card
    ├── marketplace/               # marketplace-item-card, bundle-card, buyer-side lists
    └── messages/                  # thread, offer card, deal banner, phone reveal, pinned item card
```

### Web Hooks (`apps/web/src/hooks/`)

| Hook | Purpose |
|---|---|
| `use-auth` | Firebase auth state + ID token plumbing |
| `use-sales` | Sales list + status |
| `use-inventory` | Sale summary + WS + fallback polling |
| `use-upload` / `use-append-upload` | Video upload state machines |
| `use-websocket` | Reusable WS lifecycle + reconnect |
| `use-messages` / `use-send-message` / `use-messages-ws` | Threads, send, real-time |
| `use-conversations` | Thread list |
| `use-offers` | Structured offer flow |
| `use-notifications` | In-app notifications |
| `use-saved` | Saved items |
| `use-pin` | Pinned item in chat |
| `use-phone` | Post-deal phone reveal |
| `use-settings` | Full settings CRUD: `useMySettings`, `useUpdateProfile`, `useUpdateLocation`, `useUpdateNotifications`, `useUpdatePreferences`, `useUpdatePrivacy` |
| `use-username` | `useUsername`, `useUsernameAvailability` |
| `use-landing` | Public landing data |

### Mobile Hooks (`apps/mobile/hooks/`)

| Hook | Purpose |
|---|---|
| `use-conversations` | Thread list + `useUnreadCount` (tab badge) |
| `use-messages` / `use-send-message` / `use-messages-ws` | Threads, send, real-time |
| `use-offers` | Structured offer flow |
| `use-notifications` | In-app notification feed |

### Web Lib (`apps/web/src/lib/`)

- `api.ts` — **ALL web API calls live here.** Single `apiRequest<T>()` wrapper. Module-level `_idToken` set by `AuthProvider`, auto-injected as `Authorization: Bearer ...`.
- `types.ts` — `InventoryItem`, `RoomBundle`, `SaleSummary`, `InventoryImage`, message + offer types.
- `schemas.ts` — Zod schemas for forms.
- `firebase.ts` — Firebase Client SDK init (supports Google SSO via `GoogleAuthProvider`).
- `sale-context.tsx` — Context for current sale across cockpit routes.
- `marketplace-filters.ts` — search/filter state.
- `constants.ts` — shared constants.
- `utils.ts` — `cn()` = clsx + tailwind-merge.
- `capture/` — camera + frame helpers (canvas → JPEG blob), `CapturedItem` / `PendingDetection` / `CaptureToast` types, `dataUrlToFile`, `blobToFile`.

### Shared Packages (`packages/`)

- `@myrio/api` — shared API client. Call `configure({ apiBaseUrl })` once at app startup. Used by both web and mobile.
- `@myrio/core` — shared utilities: `SYDNEY_SUBURBS`, `suburbsForPostcode(postcode)`, `isValidPostcode(str)`, suburb type definitions.
- `@myrio/types` — shared TypeScript interfaces: `NotifPrefs`, `SellerPrefs`, `PrivacyPrefs`, and other cross-platform domain types.

### Mobile Lib (`apps/mobile/lib/`)

- `capture-store.ts` — Zustand (or similar) store for capture session state.
- `query-client.ts` — shared `QueryClient` instance for the mobile app.
- `firebase.ts` — Firebase Client SDK init for mobile.

## Key Flows

### Live Capture (Primary — `/seller-central/capture`)

1. `CapturePermissionsGate` — request camera (required), mic (optional).
2. `CaptureStage` — `getUserMedia` live preview. No on-device ML (MediaPipe removed per capture revamp).
3. User taps item → frame extracted via canvas → `captureFrame(eventId, file)`:
   - `POST /sales/{id}/capture/frame` with JPEG
   - Gemini single-frame identify → `{name, brand, predicted_original_price, gcs_uri}`
   - Updates `confirmedItems` state; `frameSrc` (data URL) kept for thumbnail display
4. "Finish" → `ItemReviewScreen` — review/remove confirmed items.
5. "Upload & Process" → `handleProcess()`:
   - `finalizeCaptureV2(eventId, analyzedItems)` — sends pre-analyzed items, not raw frames
   - Fallback to `processFrames()` if all `captureFrame` calls failed
6. `ProcessingScreen` with `mode="live"` + `capturedItems` prop.
7. Polls `getStatus()` every 3s → redirects to `/inventory/${eventId}`.

### Video Upload (Secondary — `/seller-central/create`)

1. `UploadScreen` — drag-drop or file pick.
2. `initSale()` → signed PUT URL → XHR upload to GCS.
3. `startProcessing()` → backend extraction pipeline starts.
4. `ProcessingScreen` with `mode="batch"` — animated fake item ticker (items not yet known).
5. Same poll → redirect to inventory.

### Inventory Cockpit (`/inventory/[eventId]`)

- `useInventory(eventId)` — WebSocket + fallback polling (1500 ms during processing/pricing).
- Auto-refetch summary on status transitions.
- `LoadingOverlay` during processing/pricing.
- All CRUD mutations (bundle, item, image, publish, re-estimate) invalidate queries.

### Messages v2 (Offers + Phone Reveal)

- Single thread per buyer-seller pair.
- Per-message sale/item context (pinned item card at top).
- Message types: `text`, `offer`, `counter`, `accept`.
- On offer accept → item `RESERVED`, transaction created, deal-agreed banner, phone reveal unlocked.

## Settings Page (`/settings`)

Six-section settings page at `apps/web/src/app/(sellers)/settings/page.tsx`. Left-nav SPA-style — no page reload between sections.

| Section | Key features |
|---|---|
| **Profile** | Avatar (upload/remove), display name, seller bio, username (availability check, 7-day cooldown) |
| **Account** | Email + password change, Google SSO status (connected badge) |
| **Contact & Pickup** | Australian mobile number (E.164), auto-share toggle, suburb/state combobox (`@myrio/core` suburb data) |
| **Notifications** | Per-event toggles for selling (msg, offer, counter, deal, ready, viewed) and buying (buy_msg, buy_offer, price_drop) — auto-saves on toggle |
| **Preferences** | Payment methods (cash/bank/PayID/Afterpay), pickup days + times (pills), min offer threshold (slider 40–95%) |
| **Privacy** | Messaging filter (anyone/verified/active buyers), profile visibility toggle, blocked users list |

All sections backed by `useMySettings()` from `hooks/use-settings.ts` → `GET /users/me/settings`.

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

- `batch`: animated orb + fake discovery ticker (video flow — items unknown).
- `live`: real item list with `frameSrc` thumbnails + "Pricing…" status badge.

Both modes share polling `useEffect` and `goToDashboard` / `stayAndWatch` CTAs.

## API Client (`src/lib/api.ts`)

- Base URL: `NEXT_PUBLIC_API_URL` → fallback to production Cloud Run URL.
- Auth: module-level `_idToken` set by `AuthProvider`; `setAuthToken()` updates it.
- `apiRequest<T>(url, init)` — parses errors from FastAPI `detail` field, handles 204.
- Key capture functions: `initCaptureSale`, `captureFrame`, `finalizeCaptureV2`, `finalizeCapture` (legacy), `processFrames` (fallback).
- Always type the return: `apiRequest<SaleSummary>(...)`.

## TanStack Query Conventions

- Single `QueryClient` in `providers.tsx`.
- Polling: **conditional**, 1500 ms only during `processing` / `pricing_in_progress`. Idle queries don't poll.
- Mutations: `queryClient.invalidateQueries` on success.
- `staleTime: 5 * 60 * 1000` for data stable during AI processing.
- WebSocket events `setQueryData` or `invalidate` — don't bypass the cache.

## Design System

- **Dark-only.** `<html className="dark">` hardcoded. No light mode planned.
- **Tailwind v4.** `@theme {}` block in `src/app/globals.css`. No `tailwind.config.js`.
- **Layout invariant.** Authenticated shell pages: `pl-64` (sidebar) + `pt-16` (header). Don't override.
- **Key tokens:**
  - `bg-surface`, `bg-surface-container-low/high/lowest/highest`
  - `text-on-surface`, `text-on-surface-variant`
  - `text-primary` — #adc6ff electric blue (CTAs, links)
  - `text-tertiary` — #4edea3 green (pricing, positive values)
  - `border-outline`, `border-outline-variant`
- **Icons:** lucide-react only. Never introduce other icon libraries.
- **Class merging:** `cn()` from `lib/utils.ts` for all conditional classes.
- **Primitives:** Radix wrapped in `components/ui/` (`button`, `dialog`, `sheet`, `dropdown-menu`, `tooltip`, `badge`, `input`, `label`).

## Adding New Features

**New page:**
1. `src/app/<route>/page.tsx`
2. API call → `src/lib/api.ts`
3. Type → `src/lib/types.ts`
4. Data hook → `src/hooks/` with TanStack Query

**New API call:**
Use `apiRequest<ReturnType>`, named export, add TypeScript interface for request/response.

**New component:**
`src/components/features/<feature>/` — match existing filename casing (kebab-case for create/inventory, PascalCase for capture).

**New shell element:** belongs under `src/components/shell/` and integrates via the root `layout.tsx`.

## Authentication

**Web:**
- Firebase Client SDK (`lib/firebase.ts`). Email/password + Google SSO (`GoogleAuthProvider`).
- `AuthProvider` (in `providers.tsx`) maintains user + ID token.
- Token auto-injected in every `apiRequest` via module-level `_idToken`.
- WebSocket auth via `?token=` query param.
- Backend dev bypass active locally when `K_SERVICE` absent (use `dev_*` tokens).

**Mobile:**
- Firebase Client SDK (`apps/mobile/lib/firebase.ts`).
- `AuthProvider` (`apps/mobile/contexts/auth-context.tsx`) — user + loading state.
- `AuthGate` in root layout redirects unauthenticated users to `/(auth)/login`.

## Environment Variables

**Web (`apps/web/.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:8080    # local backend
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

**Mobile (`apps/mobile/.env.local`):**
```
EXPO_PUBLIC_API_URL=http://localhost:8080   # local backend
```

Production `NEXT_PUBLIC_*` values are baked at Docker build time via `--build-arg`. Changing the backend URL requires a fresh Cloud Build run.

## CI/CD

Cloud Build on push to `master`:

1. Multi-stage Docker build (`output: 'standalone'`)
2. Push to Artifact Registry
3. Deploy to Cloud Run (`australia-southeast1`) with automatic traffic migration

**Current production API:** https://myrio-api-p6osvytooa-ts.a.run.app (web: https://myrio-web-p6osvytooa-ts.a.run.app; custom domain myrio.com.au pending DNS)

## Additional Docs

- `README.md` — production-facing documentation
- `AGENTS.md` — pointers for non-Claude coding agents
- `../shiftready-backend/CLAUDE.md` — backend AI-pairing guide
