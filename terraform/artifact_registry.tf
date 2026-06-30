resource "google_artifact_registry_repository" "valzu_chat" {
  depends_on = [google_project_service.required]

  location      = var.region
  repository_id = "valzu-chat"
  description   = "Valzu Chat container images"
  format        = "DOCKER"
}
