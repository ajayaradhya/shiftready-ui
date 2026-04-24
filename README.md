# 🌐 ShiftReady UI \| Relocation Marketplace

The **ShiftReady UI** is the frontend engine for an AI-driven relocation
marketplace. It enables users to upload residential walkthroughs, review
AI-extracted inventory, and manage listing prices for the Sydney resale
market.

------------------------------------------------------------------------

## 🚀 Key Features

-   **AI Inventory Dashboard**\
    Interactive review system for assets identified by Gemini 3.1 Flash.

-   **Zero-Blink Processing UI**\
    Real-time polling and state transitions for background vision
    pipelines.

-   **Urgency Pricing Cockpit**\
    Visualization of market-grounded price recommendations based on
    move-out deadlines.

-   **Responsive Inventory Management**\
    Mobile-first design for on-site room-by-room inventory verification.

------------------------------------------------------------------------

## 🛠 Tech Stack

-   **Framework:** Next.js (App Router, Standalone Mode)\
-   **Styling:** Tailwind CSS & Lucide Icons\
-   **Deployment:** Google Cloud Run (australia-southeast1)\
-   **CI/CD:** Google Cloud Build (triggered on `master` branch push)

------------------------------------------------------------------------

## 🔧 Local Development

### 1. Prerequisites

-   Node.js 20+
-   Running instance of the ShiftReady Backend

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

    NEXT_PUBLIC_API_URL=http://localhost:8000

### 3. Installation

    npm install
    npm run dev

Access the app at: http://localhost:3000

------------------------------------------------------------------------

## 🚀 CI/CD Pipeline (Google Cloud)

This repository is configured for automated deployment via **Google
Cloud Build**.

### Build Logic

-   **Trigger:** Automatic on push to `master`
-   **Environment Injection:**\
    `NEXT_PUBLIC_API_URL` is passed as a Docker `--build-arg` and baked
    into the client bundle
-   **Containerization:**\
    Multi-stage Dockerfile producing a lightweight standalone build
-   **Rollout:**\
    Deployment to Cloud Run with automatic traffic migration

### Production Environment Variable

To change the API target, update the `_NEXT_PUBLIC_API_URL` substitution
variable in the Cloud Build trigger.

**Current Production API:**\
https://shiftready-api-12644234558.australia-southeast1.run.app

------------------------------------------------------------------------

## 📂 Project Structure

    app/            # Next.js App Router (pages & layouts)
    components/     # Shared UI components (inventory cards, uploaders)
    lib/            # API client (FastAPI handshake logic)
    public/         # Static assets
    next.config.js  # Configured with output: 'standalone'
    Dockerfile      # Multi-stage production build
    cloudbuild.yaml # GCP CI/CD definition

------------------------------------------------------------------------

## 🛡 License

**Internal Proprietary --- ShiftReady (2026)**
