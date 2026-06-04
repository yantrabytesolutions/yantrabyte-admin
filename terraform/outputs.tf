output "website_static_ip" {
  value       = aws_eip.web_eip.public_ip
  description = "The static IP address (Elastic IP) allocated to the EC2 instance."
}
