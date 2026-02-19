## Overview

This is a production-ready chat app built with **Next.js App Router** that uses the **Vercel AI SDK** and **Mistral models**.

- **Text-to-text only** (no voice, no web search)
- **Sessioned chats** stored in **MongoDB**
- **Authentication** handled by Better Auth (Mongo adapter)
- Can be run **fully in the EU**:
  - Mistral models are hosted in the EU
  - You can run MongoDB and the app in EU regions (self-hosted or cloud)

---

## Environment setup

Copy the example env file and fill in your secrets:

```bash
cp .env.example .env
```

Required keys:

- **MISTRAL_API_KEY**: your Mistral API key (EU-hosted LLMs)
- **MongoDB settings**:
  - `MONGODB_DB`, `MONGODB_HOST`, `MONGODB_PORT`, `MONGODB_AUTH_SOURCE`
  - Or you can set a single `MONGODB_URI` instead if you prefer
- **Auth**:
  - `BETTER_AUTH_SECRET`: long random secret
  - `BETTER_AUTH_URL`: base URL of the app (e.g. `http://localhost:3000` in dev, your domain in prod)

> Do **not** commit `.env` – only `.env.example` should be in git.

---

## Running locally (self-hosted dev)

First, start the local MongoDB instance (recommended for persistence):

```bash
docker compose up -d
```

Then run the development server (with your preferred package manager):

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open `http://localhost:3000` and:

- Visit `/signup` to create an account
- Then you’ll be redirected to `/` which creates your first chat and takes you to `/c/[chat-id]`

---

## Production deployment (self-hosted)

You can run this app as a regular Node.js service behind Nginx/Traefik or in Kubernetes.

### 1. Build the app

```bash
npm install
npm run build
```

Or build using the provided `Dockerfile`:

```bash
docker build -t valzu-chat .
```

### 2. Run with your own MongoDB

Point your `.env` to your production MongoDB (for example, a managed MongoDB cluster in an EU region):

```bash
MONGODB_URI="mongodb://user:password@your-eu-mongo-host:27017/valzu-chat?authSource=admin"
```

Then run the container:

```bash
docker run -d \
  --name valzu-chat \
  -p 3000:3000 \
  --env-file .env \
  valzu-chat
```

Make sure:

- MongoDB is reachable from the app container
- `BETTER_AUTH_URL` in `.env` matches your public HTTPS URL (e.g. `https://chat.yourdomain.eu`)

---

## EU-only hosting

To keep **all data and compute in the EU**, configure:

- **Mistral**: use your Mistral API key (Mistral runs its models in EU data centers)
- **MongoDB**:
  - Run MongoDB on your own EU server, or
  - Use a managed MongoDB service with an EU region (e.g. `eu-west`, `eu-central`)
- **App hosting**:
  - Deploy the Node.js app on EU-based infrastructure (Hetzner, OVH, Scaleway, Fly.io EU regions, etc.)

With this setup:

- User data stays in your MongoDB running in the EU
- Auth data is stored in the same MongoDB
- LLM calls go only to Mistral’s EU endpoints

---

## API / architecture quick notes

- **Routes**
  - `/` – creates a new chat (if signed in) and redirects to `/c/[chat-id]`
  - `/c/[chat-id]` – main chat UI (with sidebar for chat history)
  - `/signin` and `/signup` – email + password auth
- **Chat**
  - Uses the Vercel AI SDK `useChat` + `/api/chat` streaming endpoint
  - Chats are stored in MongoDB in the `chats` collection
- **Auth**
  - Better Auth using MongoDB adapter
  - Session protected chat routes via `app/c/layout.tsx`

---

## Mistral configuration

Set your Mistral API key in `.env`:

```bash
MISTRAL_API_KEY="your-mistral-api-key"
```

The app already uses Mistral models via the Vercel AI SDK; you can pick models from the selector in the chat UI.

