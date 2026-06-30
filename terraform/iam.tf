resource "google_service_account" "backend" {
  account_id   = "valzu-backend"
  display_name = "Valzu Backend Cloud Run"
}

resource "google_service_account" "frontend" {
  account_id   = "valzu-frontend"
  display_name = "Valzu Frontend Cloud Run"
}

resource "google_project_iam_member" "backend_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "frontend_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.frontend.email}"
}

resource "google_cloud_run_v2_service_iam_member" "frontend_invokes_backend" {
  name     = google_cloud_run_v2_service.backend.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.frontend.email}"
}
