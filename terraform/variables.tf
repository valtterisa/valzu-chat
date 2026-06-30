variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  description = "GCP region for Cloud Run and Artifact Registry"
  default     = "europe-west1"
}

variable "backend_image" {
  type        = string
  description = "Container image URI for the Go backend service"
}

variable "frontend_image" {
  type        = string
  description = "Container image URI for the Next.js frontend"
}

variable "backend_min_instances" {
  type        = number
  description = "Minimum backend Cloud Run instances"
  default     = 0
}

variable "frontend_min_instances" {
  type        = number
  description = "Minimum frontend Cloud Run instances"
  default     = 0
}
