# Valzu Chat

Chat app: **Next.js frontend** + **Go ADK backend** (Gemini + Google Search) + **Firestore** for threads/messages.

## Commands

```bash
pnpm dev      # local dev — backend :8080 + frontend :3000
pnpm build    # compile backend → bin/backend + Next.js production build
pnpm deploy   # Docker build/push + terraform apply (prod)
```

Deploy env vars (optional overrides):

```bash
export PROJECT=valzu-chat-prod
export REGION=europe-west1
pnpm deploy                  # tag = git short SHA
pnpm deploy -- v1.2.3        # custom image tag
```

---

## First-time setup

### Install

| Tool | Version |
|------|---------|
| [Go](https://go.dev/dl/) | 1.25+ |
| [Node.js](https://nodejs.org/) | 22+ |
| [pnpm](https://pnpm.io/) | latest |
| [gcloud CLI](https://cloud.google.com/sdk/docs/install) | latest |
| [Terraform](https://developer.hashicorp.com/terraform/install) | 1.5+ (deploy only) |
| [Docker](https://docs.docker.com/get-docker/) | latest (deploy only) |

### GCP (once per dev project)

Use a **dev project** — don't point local dev at prod.

```bash
gcloud auth login
gcloud auth application-default login

export GOOGLE_CLOUD_PROJECT=valzu-chat-dev
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Billing must be enabled (GCP console)

gcloud services enable firestore.googleapis.com aiplatform.googleapis.com \
  --project=$GOOGLE_CLOUD_PROJECT

gcloud firestore databases create --location=eur3 --project=$GOOGLE_CLOUD_PROJECT

gcloud firestore indexes composite create --project=$GOOGLE_CLOUD_PROJECT \
  --collection-group=threads --field-config=field-path=updatedAt,order=descending

gcloud firestore indexes composite create --project=$GOOGLE_CLOUD_PROJECT \
  --collection-group=messages --field-config=field-path=createdAt,order=ascending
```

Wait until indexes are `READY` in the [Firestore console](https://console.cloud.google.com/firestore/indexes).

### Env files + deps

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Edit both — set GOOGLE_CLOUD_PROJECT to your dev project

pnpm install
cd backend && go mod download && cd ..
```

**.env**
```env
GOOGLE_CLOUD_PROJECT=valzu-chat-dev
FIRESTORE_PROJECT_ID=valzu-chat-dev
BACKEND_API_URL=http://localhost:8080
```

**backend/.env**
```env
GOOGLE_CLOUD_PROJECT=valzu-chat-dev
GOOGLE_CLOUD_LOCATION=europe-west1
GOOGLE_GENAI_USE_VERTEXAI=True
PORT=8080
```

### Run

```bash
pnpm dev
```

Open **http://localhost:3000**

---

## What each command does

| Command | What happens |
|---------|----------------|
| `pnpm dev` | Starts Go backend in background, waits for `/health`, then `next dev` on :3000. Ctrl+C stops both. |
| `pnpm build` | `go build` → `bin/backend`, then `next build` → `.next/` |
| `pnpm deploy` | Builds Docker images, pushes to Artifact Registry, runs `terraform apply` |

Firestore and Vertex AI always hit GCP — even in dev. Credentials come from `gcloud auth application-default login`.

---

## Sanity checks

```bash
curl http://localhost:8080/health        # backend
curl http://localhost:3000/api/health    # frontend
```

---

## Old two-terminal flow (optional)

If you prefer separate processes:

```bash
cd backend && go run .   # terminal 1
pnpm exec next dev       # terminal 2
```

---

## Run with Docker

Everything in containers (Firestore still uses your GCP project):

```bash
gcloud auth application-default login

export GOOGLE_CLOUD_PROJECT=valzu-chat-dev
export FIRESTORE_PROJECT_ID=valzu-chat-dev

cp .env.example .env
cp backend/.env.example backend/.env
# Edit both .env files with your project ID (see above)

docker compose up --build
```

Open **http://localhost:3000**

The frontend container mounts your ADC file from `~/.config/gcloud/application_default_credentials.json`. If that file is missing, run `gcloud auth application-default login` again.

**Easier variant:** run only the backend in Docker and the frontend on the host:

```bash
docker compose up backend --build
pnpm exec next dev
```

---

## How it fits together

```
Browser  →  POST /api/stream     →  Next.js (localhost:3000)
Next.js  →  Firestore            →  GCP (threads + messages)
Next.js  →  POST /stream         →  Go backend (localhost:8080)
Backend  →  Vertex AI Gemini     →  GCP (+ Google Search tool)
```

| URL | What |
|-----|------|
| http://localhost:3000 | Chat UI |
| http://localhost:8080/health | Backend health |
| http://localhost:3000/api/health | Frontend health |

---

## Production deploy

First time only — copy and edit terraform vars:

```bash
cd terraform && cp terraform.tfvars.example terraform.tfvars && cd ..
```

Then:

```bash
export PROJECT=valzu-chat-prod
export REGION=europe-west1
pnpm deploy
```

Same as `./scripts/deploy.sh` — builds both Docker images, pushes to Artifact Registry, runs `terraform apply`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `FIRESTORE_PROJECT_ID or GOOGLE_CLOUD_PROJECT must be set` | Copy `.env.example` → `.env` and set project IDs |
| Firestore `FAILED_PRECONDITION` / index error | Create composite indexes (step 1 above) and wait until `READY` |
| Backend `failed to create model` / Vertex errors | Enable `aiplatform.googleapis.com`; check billing; confirm `GOOGLE_GENAI_USE_VERTEXAI=True` |
| Frontend can't reach backend | Backend must be running; `BACKEND_API_URL=http://localhost:8080` in `.env` |
| Docker frontend auth errors | Run `gcloud auth application-default login`; check ADC mount path in `docker-compose.yml` |
| Empty backend response | Retry — Google Search + streaming can be slow on first call; check backend terminal logs |
| `go: go.mod requires go >= 1.25` | Upgrade Go: https://go.dev/dl/ |

---

## Project layout

```
backend/            Go ADK service — POST /stream, GET /health
app/api/            Next.js API routes
lib/                Firestore, SSE, backend client, hooks
terraform/          GCP infra (Cloud Run, Firestore, IAM)
scripts/            dev.sh, build.sh, deploy.sh
```

## Env reference

| Variable | Where | Purpose |
|----------|-------|---------|
| `GOOGLE_CLOUD_PROJECT` | both | GCP project ID |
| `FIRESTORE_PROJECT_ID` | frontend | Firestore project (usually same) |
| `BACKEND_API_URL` | frontend | Backend base URL (`http://localhost:8080` locally) |
| `GOOGLE_CLOUD_LOCATION` | backend | Vertex region (`europe-west1`) |
| `GOOGLE_GENAI_USE_VERTEXAI` | backend | Must be `True` — no API keys |
