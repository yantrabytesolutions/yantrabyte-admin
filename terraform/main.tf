# 1. Ask AWS for the latest official Ubuntu 24.04 server image
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (The creators of Ubuntu)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# 2. Build a Security Gatehouse (Firewall)
resource "aws_security_group" "web_sg" {
  name        = "yantrabyte-web-sg"
  description = "Allow SSH and web traffic to reach our server"

  # Allow SSH (Port 22) - To log into the server from our computer
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTP (Port 80) - Standard website traffic
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS (Port 443) - Secure website traffic
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow the server to access the internet to download updates
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. Create the virtual computer in the sky
resource "aws_instance" "web_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro" # Free Tier computer in Mumbai!
  key_name      = "yantrabyte-key" # Make sure this matches your AWS Key Pair name

  vpc_security_group_ids = [aws_security_group.web_sg.id]

  # Root disk size configuration (20GB - well within AWS Free Tier 30GB limit)
  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name = var.instance_name
  }
}

# 4. Give the server a Static IP (Elastic IP) that NEVER changes!
resource "aws_eip" "web_eip" {
  instance = aws_instance.web_server.id
  domain   = "vpc"
}
