<div align="center">

# ShiftReady UI

**Seller dashboard and public marketplace for ShiftReady — an AI-driven residential relocation platform.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000.svg?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack-Query%20v5-FF4154.svg?logo=reactquery&logoColor=white)](https://tanstack.com/query/latest)
[![Firebase](https://img.shields.io/badge/Auth-Firebase%2012-FFCA28.svg?logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Cloud Run](https://img.shields.io/badge/Deploy-Cloud%20Run-4285F4.svg?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)

Tap-to-capture inventory · AI extraction + pricing · buyer marketplace · offers + messaging.

[Companion Backend](../shiftready-backend) · [Live Production](https://shiftready-api-12644234558.australia-southeast1.run.app) · [Report Issue](https://github.com/ajayaradhya/shiftready-ui/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [User Flows](#user-flows)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Routing](#routing)
- [State & Data Fetching](#state--data-fetching)
- [Design System](#design-system)
- [Capture Pipeline (Client)](#capture-pipeline-client)
- [Authentication](#authentication)
- [Testing & Quality](#testing--quality)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

ShiftReady UI is the user-facing surface of the ShiftReady platform. Two audiences share the app:

- **Sellers** — initiate a sale, capture inventory live or upload a walkthrough video, review and edit AI-extracted bundles, set a move-out deadline, publish to the marketplace, and message buyers.
- **Buyers** — browse the marketplace, save items, message sellers, make structured offers, and reveal seller contact info once a deal is agreed.

The UI is a fully client-rendered Next.js 16 App Router app backed by [`shiftready-backend`](../shiftready-backend) over REST + WebSockets. Firebase handles authentication; TanStack Query handles data fetching and cache invalidation.

---

## Key Features

- **Tap-to-capture** — single-tap item capture with on-device camera; Gemini identifies name/brand/price in the background.
- **Two-mode `ProcessingScreen`** — `live` (real captured items with thumbnails) or `batch` (animated discovery ticker for video uploads).
- **Inventory cockpit** — bundle/item CRUD, per-item photo gallery (upload, cover, lightbox, delete), append additional video.
- **Urgency pricing review** — Gemini-suggested prices with seller-editable overrides; reasoning displayed inline.
- **Marketplace** — buyer-side browse, sale detail, item detail, saved items, purchases, help.
- **Messages v2** — single thread per buyer-seller pair, structured offer/counter/accept, pinned item card, post-deal phone reveal.
- **Modern shell** — slim header, icon-rail sidebar with hover-expand, profile popover, slide-over notifications, ⌘K command palette, mobile bottom tab bar.
- **Real-time** — WebSocket-driven pipeline status and message delivery; polling fallback during AI processing.

---

## Architecture

```mermaid
flowchart LR
    User(["🧑 Seller / Buyer"])

    subgraph Browser["Browser"]
        subgraph Shell["App Shell"]
            Header[Header]
            Sidebar[Icon-rail Sidebar]
            Palette["⌘K Command Palette"]
            Notifs[Notifications Panel]
        end

        subgraph Routes["App Router"]
            Auth["(auth)\nlogin · register"]
            Sellers["(sellers)\ndashboard · capture\ninventory · messages · settings"]
            Market["(market)\nbrowse · sale · item · saved"]
            Public["(public)\npublic sale view"]
        end

        Hooks["TanStack Query Hooks\nuse-sales · use-inventory\nuse-messages · use-offers\nuse-notifications · ..."]
        Api["lib/api.ts\nsingle apiRequest&lt;T&gt; wrapper"]
        Cap["lib/capture/\ncamera + frame helpers"]
        Fire["lib/firebase.ts\nClient SDK"]
    end

    subgraph Backend["FastAPI (Cloud Run)"]
        REST[REST + WebSocket]
    end

    subgraph GCP["Google Cloud"]
        Auth2[(Firebase Auth)]
        GCS[(Cloud Storage\nsigned URLs)]
    end

    User --> Shell
    Shell --> Routes
    Routes --> Hooks --> Api --> REST
    Routes -. WebSocket .- REST
    Cap -. PUT frames via signed URL .- GCS
    Fire <--> Auth2
    Api -. Bearer token .- REST
```

### Component layering

```mermaid
flowchart TB
    Pages["app/**/page.tsx"] --> Features["components/features/*"]
    Pages --> ShellC["components/shell/*"]
    Features --> UIK["components/ui/*\n(Radix primitives)"]
    Features --> HooksLayer["hooks/*"]
    HooksLayer --> ApiLayer["lib/api.ts"]
    Features --> LibLayer["lib/*\n(types · utils · capture · firebase)"]
    ApiLayer --> Backend[(FastAPI)]
```

---

## User Flows

### Live capture → marketplace publish

```mermaid
sequenceDiagram
    autonumber
    actor S as Seller
    participant UI as UI
    participant API as Backend
    participant WS as WebSocket

    S->>UI: /seller-central/capture
    UI->>API: POST /sales/init-capture
    API-->>UI: eventId

    loop tap items
        S->>UI: tap item
        UI->>API: POST /capture/frame (JPEG)
        API-->>UI: { name, brand, price, gcs_uri }
    end

    S->>UI: Finish → Review
    UI->>API: POST /capture/finalize-v2 (analyzed items)
    UI->>API: WS connect /sales/{id}/ws
    API-)WS: PROCESSING
    API-)WS: READY_FOR_REVIEW
    API-)WS: PRICING_IN_PROGRESS
    API-)WS: READY_FOR_REVIEW (final)
    UI->>S: redirect /inventory/{id}

    S->>UI: review, edit, publish
    UI->>API: POST /sales/{id}/publish
    API-->>UI: LIVE
```

### Buyer offer → deal-agreed

```mermaid
sequenceDiagram
    autonumber
    actor B as Buyer
    actor S as Seller
    participant UI as UI
    participant API as Backend

    B->>UI: Item page → "Express Interest"
    UI->>API: POST /messages (opens thread)
    B->>UI: send offer
    UI->>API: POST /messages (type=offer)
    API-)S: WS new message
    S->>UI: review offer → Accept
    UI->>API: POST /messages/{id}/accept
    API-->>UI: deal-agreed (item RESERVED)
    UI->>B: WS deal-agreed
    Note over UI: Phone reveal unlocked\nfor both sides
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Standalone output) |
| UI | React 19 · Tailwind v4 (`@theme` block) · Radix UI · lucide-react · sonner |
| State / Data | TanStack Query v5 · React Context |
| Forms | react-hook-form + zod |
| Auth | Firebase 12 (Client SDK) |
| Capture | Browser MediaDevices + canvas frame extraction |
| Command palette | cmdk |
| Class utilities | clsx + tailwind-merge (`cn()`) |
| Tooling | TypeScript 5 · ESLint 9 · Prettier 3 · prettier-plugin-tailwindcss |
| Deployment | Cloud Run · Cloud Build · Artifact Registry |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A running [`shiftready-backend`](../shiftready-backend) on `http://localhost:8080`

### Install

```bash
npm install
```

### Configure

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL. Local: `http://localhost:8080` |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Web SDK config (see `.env.local.example`) |

### Run

```bash
npm run dev        # http://localhost:3000
```

### Useful scripts

```bash
npm run build         # production build (standalone)
npm run start         # serve the production build
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
npm run format        # Prettier write
npm run format:check  # Prettier check
```

### Full-stack session

```bash
# From the UI directory
claude --add-dir ../shiftready-backend

# Or from backend
claude --add-dir ../shiftready-ui
```

---

## Project Structure

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Providers + Shell (Sidebar + Header)
│   ├── page.tsx                      # Landing
│   ├── not-found.tsx                 # Custom 404
│   ├── (auth)/                       # login · register (no shell)
│   ├── (sellers)/                    # Authenticated seller routes
│   │   ├── dashboard/                # Sales list
│   │   ├── seller-central/           # Hub · capture · live-stream · create
│   │   ├── inventory/[eventId]/      # Inventory review cockpit
│   │   ├── messages/                 # Seller-side messaging
│   │   ├── settings/                 # Profile · username · phone
│   │   └── dev/                      # Dev-only tools
│   ├── (market)/                     # Buyer-facing marketplace
│   │   └── market/                   # Browse · sale · item · saved · purchases · messages · help
│   └── (public)/
│       └── sale/[eventId]/           # Anonymous public sale view
├── components/
│   ├── providers.tsx                 # QueryClientProvider + AuthProvider
│   ├── shell/
│   │   ├── header.tsx                # Slim 48px header w/ ⌘K trigger
│   │   ├── sidebar.tsx               # Icon-rail w/ hover-expand
│   │   ├── command-palette.tsx       # ⌘K (cmdk)
│   │   ├── notifications-panel.tsx   # Right slide-over
│   │   ├── profile-menu.tsx          # Radix popover
│   │   ├── bottom-tab-bar.tsx        # Mobile tabs
│   │   └── shortcuts-cheatsheet.tsx
│   ├── ui/                           # Radix-wrapped primitives (button, dialog, sheet, ...)
│   └── features/
│       ├── capture/                  # CaptureStage, ItemConfirmCard, ItemReviewScreen, ...
│       ├── create/                   # upload-screen, processing-screen, video-uploader
│       ├── inventory/                # cards, photo strip, video panel, AppendVideoModal
│       ├── seller-central/           # sale-row, bundle-card, item-card-v2
│       ├── dashboard/                # sale-card
│       ├── marketplace/              # buyer-side cards + lists
│       └── messages/                 # thread, offer card, deal banner, phone reveal
├── hooks/                            # TanStack Query + WS hooks (see list below)
└── lib/
    ├── api.ts                        # All API calls — single apiRequest<T> wrapper
    ├── types.ts                      # Domain types (InventoryItem, SaleSummary, ...)
    ├── schemas.ts                    # Zod schemas
    ├── firebase.ts                   # Client SDK init
    ├── sale-context.tsx              # Context: current sale across cockpit routes
    ├── marketplace-filters.ts
    ├── constants.ts
    ├── utils.ts                      # cn() + helpers
    └── capture/                      # camera + frame helpers
```

### Hooks at a glance

| Hook | Purpose |
|---|---|
| `use-auth` | Firebase auth state + ID token plumbing |
| `use-sales` | List + status polling |
| `use-inventory` | Sale summary + WS + fallback polling |
| `use-upload` / `use-append-upload` | Video upload state machines |
| `use-websocket` | Reusable WS lifecycle + backoff |
| `use-messages` / `use-send-message` / `use-messages-ws` | Threads, send, real-time |
| `use-conversations` | Thread list |
| `use-offers` | Structured offer flow |
| `use-notifications` | In-app notifications |
| `use-saved` | Saved items |
| `use-pin` | Pinned item card in chat |
| `use-phone` | Post-deal phone reveal |
| `use-settings` / `use-username` | Profile + username |
| `use-landing` | Public landing data |

---

## Routing

```mermaid
flowchart LR
    Landing["/"] --> Auth["(auth)"]
    Auth --> Login[/login/]
    Auth --> Register[/register/]

    Landing --> Sellers["(sellers)\n(authenticated)"]
    Sellers --> Dash[/dashboard/]
    Sellers --> SC[/seller-central/]
    SC --> Capture[/seller-central/capture/]
    SC --> Create[/seller-central/create/]
    Sellers --> Inv[/inventory/eventId/]
    Sellers --> Msg[/messages/]
    Sellers --> Set[/settings/]

    Landing --> Market["(market)"]
    Market --> Browse[/market/]
    Market --> Sale[/market/sale/eventId/]
    Market --> Item[/market/item/eventId/bundleId/itemId/]
    Market --> Saved[/market/saved/]
    Market --> Purchases[/market/purchases/]
    Market --> MMsg[/market/messages/]

    Landing --> Pub["(public)\nanonymous"]
    Pub --> PubSale[/sale/eventId/]
```

App Router layout groups:

- `(auth)` — bare layout, no shell.
- `(sellers)` — authenticated shell (sidebar + header).
- `(market)` — buyer marketplace shell.
- `(public)` — anonymous sale view.

---

## State & Data Fetching

- Single `QueryClient` in `components/providers.tsx`.
- Default `staleTime: 5 min` for data stable during AI processing.
- Polling is **conditional** — only 1500 ms during `processing` / `pricing_in_progress`. Idle queries do not poll.
- All mutations call `queryClient.invalidateQueries` on success.
- WebSockets supplement (not replace) polling — pipeline events and message delivery push fresh state to the client.

```mermaid
sequenceDiagram
    participant Comp as Component
    participant Hook as use-inventory
    participant TQ as TanStack Query
    participant WS as WebSocket
    participant API as REST

    Comp->>Hook: subscribe
    Hook->>TQ: useQuery summary
    TQ->>API: GET /sales/{id}/summary
    Hook->>WS: connect /sales/{id}/ws
    WS-->>Hook: status=PRICING_IN_PROGRESS
    Hook->>TQ: setQueryData / invalidate
    WS-->>Hook: status=READY_FOR_REVIEW
    Hook->>TQ: refetch summary
    TQ-->>Comp: latest data
```

---

## Design System

- **Dark-only.** `<html className="dark">` is hardcoded; light mode is not on the roadmap.
- **Tailwind v4** via `@theme {}` block in `src/app/globals.css`. No `tailwind.config.js`.
- **Layout invariants.** Authenticated shell pages use `pl-64` (sidebar) + `pt-16` (header). New pages must not override this.
- **Key tokens** (Tailwind classes):
  - Backgrounds: `bg-surface`, `bg-surface-container-low/high/lowest/highest`
  - Text: `text-on-surface`, `text-on-surface-variant`
  - Accents: `text-primary` (#adc6ff electric blue), `text-tertiary` (#4edea3 pricing/positive)
  - Borders: `border-outline`, `border-outline-variant`
- **Icons.** lucide-react only. Do not introduce additional icon libraries.
- **Class merging.** Use `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for conditional class strings.
- **Component primitives.** Radix (Dialog, DropdownMenu, Tooltip, Slot) wrapped in `components/ui/`.

---

## Capture Pipeline (Client)

Tap-first capture lives in `app/(sellers)/seller-central/capture/page.tsx` and `components/features/capture/`.

1. `CapturePermissionsGate` — request camera (required); mic optional.
2. `CaptureStage` — `getUserMedia` live preview.
3. On tap → frame extracted via canvas → `POST /sales/{id}/capture/frame` → Gemini identify → result appended to `confirmedItems` (with `frameSrc` data URL for instant thumbnails).
4. "Finish" → `ItemReviewScreen` → edit/remove → "Upload & Process".
5. `finalizeCaptureV2(eventId, analyzedItems)` ships pre-analyzed items; backend refines + prices.
6. `ProcessingScreen` with `mode="live"` shows the real captured items + pricing status.
7. On `READY_FOR_REVIEW`, redirect to `/inventory/[eventId]`.

```tsx
<ProcessingScreen
  eventId={id}
  uploadedFile={null}
  mode="live"              // "batch" | "live"
  capturedItems={items}    // CapturedItem[] — live mode only
/>
```

`batch` mode (video upload) shows an animated discovery ticker because items are not yet known. Both modes share polling logic and CTAs.

---

## Authentication

- Firebase Client SDK (`lib/firebase.ts`).
- `AuthProvider` (in `providers.tsx`) maintains the current user + ID token.
- `lib/api.ts` holds a module-level `_idToken` set via `setAuthToken()`; auto-injected on every `apiRequest<T>()` call as `Authorization: Bearer ...`.
- WebSocket connections pass the token as `?token=` query param.
- Local dev: backend accepts `dev_*` tokens when `K_SERVICE` is absent — useful for Storybook-style page testing without Firebase.

---

## Testing & Quality

```bash
npm run lint          # ESLint (eslint-config-next)
npm run type-check    # tsc --noEmit
npm run format:check  # Prettier
npm run build         # production build (catches RSC issues)
```

End-to-end testing is run through the [`verify` skill](../shiftready-backend/CLAUDE.md) — boot backend + UI, exercise the live capture and publish flows, watch console + network for regressions.

---

## Deployment

```mermaid
flowchart LR
    Push[git push master] --> Trigger[Cloud Build trigger]
    Trigger --> Build["Multi-stage Docker build\n--build-arg NEXT_PUBLIC_API_URL\n--build-arg firebase config"]
    Build --> Push2[Push to Artifact Registry]
    Push2 --> Deploy[Deploy to Cloud Run\naustralia-southeast1]
    Deploy --> Live[(Production URL)]
```

- `output: 'standalone'` in `next.config.js` for minimal runtime image.
- `NEXT_PUBLIC_*` vars are **baked at build time** via Docker `--build-arg`. Changing the backend URL requires a new build — update the `_NEXT_PUBLIC_API_URL` substitution in the Cloud Build trigger.
- Traffic auto-migrates on deploy.

**Current production API:** https://shiftready-api-12644234558.australia-southeast1.run.app

### Manual deploy

```bash
gcloud builds submit --config=cloudbuild.yaml
```

---

## Contributing

1. Branch from `master`.
2. Match folder conventions:
   - New page → `src/app/<route>/page.tsx`
   - New API call → add to `src/lib/api.ts` (single export per call) + type in `src/lib/types.ts`
   - New data hook → `src/hooks/` using TanStack Query
   - New feature component → `src/components/features/<feature>/`
3. Run `npm run lint && npm run type-check && npm run build` before pushing.
4. PR must include a screenshot or short clip if the change is user-visible.

Coding conventions:

- Functional components only; no class components.
- Server Components by default; mark `"use client"` only when needed (state, effects, refs).
- All data fetching via TanStack Query hooks — no `fetch` in components.
- All API calls go through `lib/api.ts`.
- Use `cn()` for conditional classes, never string concatenation.

---

## Additional Docs

- `CLAUDE.md` — guidance for AI pair-programming agents
- `AGENTS.md` — pointers for non-Claude coding agents
- `../shiftready-backend/README.md` — backend documentation

---

## License

Proprietary — ShiftReady © 2026. All rights reserved.
