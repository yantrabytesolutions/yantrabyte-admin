terraform {
  backend "s3" {
    bucket         = "yantrabyte-tfstate-ramesh"
    key            = "yantrabyte/state/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
  }
}
