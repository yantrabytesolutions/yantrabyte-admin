terraform {
  backend "s3" {
    bucket         = "yantrabyte-tfstate-2026-prod"
    key            = "yantrabyte/state/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
  }
}
