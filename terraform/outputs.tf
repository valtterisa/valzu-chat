output "frontend_url" {
  value       = google_cloud_run_v2_service.frontend.uri
  description = "Public URL for the Next.js frontend"
}

output "backend_url" {
  value       = google_cloud_run_v2_service.backend.uri
  description = "Internal URL for the Go backend (requires IAM token)"
}

output "artifact_registry" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.valzu_chat.repository_id}"
  description = "Artifact Registry repository path"
}
