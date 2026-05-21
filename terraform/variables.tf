variable "aws_region" {
  type        = string
  default     = "ap-south-1"
  description = "The target AWS region to deploy the infrastructure in."
}

variable "instance_name" {
  type        = string
  default     = "Yantrabyte-Production-Server"
  description = "Name tag for the EC2 server."
}
