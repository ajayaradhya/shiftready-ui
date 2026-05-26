# ShiftReady UI

[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![Cloud Run](https://img.shields.io/badge/Deploy-Cloud%20Run-4285F4.svg)](https://cloud.google.com/run)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)

Seller dashboard and public marketplace for ShiftReady - an AI-driven residential relocation platform. Sellers capture or upload home walkthroughs, Gemini AI extracts and prices inventory, and buyers browse live sales.

**Companion backend:** [`../shiftready-backend`](../shiftready-backend) - FastAPI / Gemini service.

---

## Key Features

- **Guided Live Capture** - on-device MediaPipe detects items via camera; per-frame Gemini identifies name/brand/price in real time; sellers confirm as they walk through the home
- **AI Inventory Dashboard** - interactive review cockpit for Gemini-extracted bundles and items with per-item photo galleries
- **Live ProcessingScreen** - after capture, shows real captured items with thumbnails and live "Pricing…" status (not a fake ticker)
- **Urgency Pricing Cockpit** - market-grounded price recommendations based on move-out deadline
- **Public Marketplace** - `/` and `/sale/[eventId]` for buyers to browse and view live sales

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Standalone Mode) |
| UI | React 19, Tailwind v4, Radix UI, lucide-react, sonner |
| State | TanStack Query v5 (polling + mutations) |
| Forms | react-hook-form + zod |
| Auth | Firebase 12 (Client SDK) |
| Capture | MediaPipe tasks-vision (WASM, on-device) |
| Deployment | Google Cloud Run (`australia-southeast1`) |
| CI/CD | Google Cloud Build |

---

## Local Development

### Prerequisites

- Node.js 20+
- Running instance of ShiftReady Backend (port 8080)

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Run

```bash
npm run dev
```

App available at http://localhost:3000.

---

## Project Structure

```
src/
├── app/                              # Next.js App Router
│   ├── page.tsx                      # Home / public browse
│   ├── (auth)/                       # login, register
│   ├── (sellers)/                    # Authenticated seller routes
│   │   ├── create/                   # Legacy video upload
│   │   ├── dashboard/                # Sales list
│   │   └── seller-central/
│   │       ├── capture/              # Live capture (primary flow)
│   │       ├── live-stream/
│   │       ├── create/
│   │       └── inventory/[eventId]/  # Inventory review cockpit
│   └── (public)/
│       └── sale/[eventId]/           # Public sale detail
├── components/features/
│   ├── capture/                      # CaptureStage, CaptureBucket, ItemConfirmCard, etc.
│   ├── create/                       # upload-screen, processing-screen, video-uploader
│   ├── inventory/                    # Inventory cards, pricing grid, video panel
│   ├── seller-central/               # sale-row, bundle-card, item-card-v2
│   ├── dashboard/                    # sale-card
│   └── marketplace/                  # marketplace-item-card, bundle-card
├── hooks/                            # TanStack Query hooks
└── lib/
    ├── api.ts                        # All API calls (centralized fetch wrapper)
    ├── types.ts                      # InventoryItem, RoomBundle, SaleSummary
    ├── firebase.ts                   # Firebase client init
    └── capture/                      # MediaPipe loader + CapturedItem types
```

---

## CI/CD

Automated deployment via Google Cloud Build on push to `master`:

1. Build - multi-stage Docker image (`output: 'standalone'`)
2. Push to Google Artifact Registry
3. Deploy to Cloud Run (`australia-southeast1`) with automatic traffic migration

`NEXT_PUBLIC_API_URL` is injected as a Docker `--build-arg` at build time and baked into the client bundle. Update the `_NEXT_PUBLIC_API_URL` substitution variable in the Cloud Build trigger to point at a different backend.

**Current Production API:** https://shiftready-api-12644234558.australia-southeast1.run.app

---

## Working with the Full Stack

```bash
# From the UI directory
claude --add-dir ../shiftready-backend
```

Or from the backend directory:

```bash
claude --add-dir ../shiftready-ui
```

See [`../shiftready-backend`](../shiftready-backend) for the backend README.

---

## License

Internal proprietary - ShiftReady 2026.
