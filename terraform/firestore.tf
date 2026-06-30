resource "google_firestore_database" "default" {
  depends_on = [google_project_service.required]

  project     = var.project_id
  name        = "(default)"
  location_id = "eur3"
  type        = "FIRESTORE_NATIVE"
}

resource "google_firestore_index" "threads_by_updated_at" {
  depends_on = [google_firestore_database.default]

  project    = var.project_id
  collection = "threads"

  fields {
    field_path = "updatedAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "messages_by_created_at" {
  depends_on = [google_firestore_database.default]

  project    = var.project_id
  collection = "messages"

  fields {
    field_path = "createdAt"
    order      = "ASCENDING"
  }
}
