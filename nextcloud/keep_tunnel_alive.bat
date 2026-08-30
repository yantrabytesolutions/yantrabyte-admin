@echo off
:loop
echo [%date% %time%] Starting SSH Reverse Tunnel...
ssh -i "C:\Users\sys1\.ssh\yantrabyte-key.pem" -o TCPKeepAlive=yes -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=no -o ConnectTimeout=15 -o ConnectionAttempts=3 -R 8080:localhost:8080 -R 0.0.0.0:2222:localhost:22 ubuntu@3.7.134.187 -N
echo [%date% %time%] Tunnel disconnected. Restarting in 10 seconds...
timeout /t 10 /nobreak
goto loop
