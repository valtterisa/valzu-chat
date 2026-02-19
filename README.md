## Valzu Chat

Enterprise-grade, privacy-focused AI chat built on **Next.js App Router**, **Vercel AI SDK**, and **Mistral models** – designed to run **fully in the EU**.

> ⚡ Opinionated starter for serious, production-ready chat apps – EU data residency, streaming UX, and auth baked in.

---

## Features

- **EU‑first architecture**
  - All traffic can stay in EU regions (app, DB, and LLM)
  - Uses **Mistral** models hosted in EU data centers
- **Production chat UX**
  - Persistent, sessioned conversations
  - Sidebar with chat history and quick switching
  - Streaming responses with partial rendering
- **Strong authentication**
  - Email/password auth with **Better Auth** (Mongo adapter)
  - Session‑protected chat routes
- **Solid data layer**
  - Chats and auth state stored in **MongoDB**
  - Easy to point at your own managed Mongo instance
- **Dev‑friendly stack**
  - **Next.js App Router**, **TypeScript**, **Vercel AI SDK**
  - API routes ready for extension (`/api/chat`, etc.)

---

## Quickstart

### 1. Install dependencies

```bash
pnpm install
# or
npm install
```

### 2. Environment setup

Copy the example env file and fill in your secrets:

```bash
cp .env.example .env
```

Fill in at least:

- **MISTRAL_API_KEY** – your Mistral API key (EU‑hosted LLMs)
- **MongoDB**
  - Either: `MONGODB_DB`, `MONGODB_HOST`, `MONGODB_PORT`, `MONGODB_AUTH_SOURCE`
  - Or: a single `MONGODB_URI`
- **Auth**
  - `BETTER_AUTH_SECRET` – long, random secret
  - `BETTER_AUTH_URL` – base URL of the app (e.g. `http://localhost:3000` in dev, your domain in prod)

> Do **not** commit `.env` – only `.env.example` should live in git.

---

## Running locally

Start a local MongoDB instance (recommended for persistence):

```bash
docker compose up -d
```

Then run the development server (pick your package manager):

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
- You’ll be redirected to `/`, which creates your first chat and sends you to `/c/[chat-id]`

---

## Production deployment (self‑hosted)

You can run this app as a regular Node.js service behind Nginx/Traefik, in Docker, or in Kubernetes.

### 1. Build the app

```bash
npm install
npm run build
```

Or build using the provided `Dockerfile`:

```bash
docker build -t valzu-chat .
```

### 2. Run with your own MongoDB (EU recommended)

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

## EU‑only hosting

To keep **all data and compute in the EU**, configure:

- **Mistral**
  - Use your Mistral API key (Mistral runs its models in EU data centers)
- **MongoDB**
  - Run MongoDB on your own EU server, or
  - Use a managed MongoDB service with an EU region (e.g. `eu-west`, `eu-central`)
- **App hosting**
  - Deploy the Node.js app on EU‑based infrastructure (Hetzner, OVH, Scaleway, Fly.io EU regions, etc.)

With this setup:

- User data stays in your MongoDB running in the EU
- Auth data is stored in the same MongoDB
- LLM calls go only to Mistral’s EU endpoints

---

## Routes & architecture

- **Routes**
  - `/` – creates a new chat (if signed in) and redirects to `/c/[chat-id]`
  - `/c/[chat-id]` – main chat UI (with sidebar for chat history)
  - `/signin` and `/signup` – email + password auth
- **Chat**
  - Vercel AI SDK `useChat` + `/api/chat` streaming endpoint
  - Chats stored in MongoDB (`chats` collection)
- **Auth**
  - Better Auth using MongoDB adapter
  - Session‑protected chat routes via `app/c/layout.tsx`

---

## Mistral configuration

Set your Mistral API key in `.env`:

```bash
MISTRAL_API_KEY="your-mistral-api-key"
```

The app already uses Mistral models via the Vercel AI SDK; you can pick models from the selector in the chat UI.

---

## Customisation ideas

- Swap the default Mistral model for your own fine‑tuned or higher‑tier model
- Add role‑based access control around specific chats or features
- Log prompts/responses to your own analytics pipeline
- Integrate your own data source (RAG, tools, or function calling) behind `/api/chat`

