#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-$(git rev-parse --short HEAD)}"
REGION="${REGION:-europe-west1}"
PROJECT="${PROJECT:-valzu-chat-prod}"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT}/valzu-chat"

echo "Building and pushing images with tag: ${TAG}"

gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

docker build -t "${REGISTRY}/backend:${TAG}" ./backend
docker build -t "${REGISTRY}/frontend:${TAG}" .

docker push "${REGISTRY}/backend:${TAG}"
docker push "${REGISTRY}/frontend:${TAG}"

cd terraform
terraform init
terraform apply \
  -var="project_id=${PROJECT}" \
  -var="region=${REGION}" \
  -var="backend_image=${REGISTRY}/backend:${TAG}" \
  -var="frontend_image=${REGISTRY}/frontend:${TAG}"
