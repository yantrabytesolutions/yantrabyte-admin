#!/bin/bash
# Nextcloud Tunnel Health Monitor
# Runs via cron every 5 minutes on the AWS server
# Detects and cleans stale SSH tunnel connections on port 2222

LOG="/home/ubuntu/tunnel_health.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check if port 2222 is listening
if ss -tuln | grep -q ':2222'; then
    # Port is listening - test if it's actually reachable (not stale)
    if timeout 5 bash -c 'echo "" > /dev/tcp/127.0.0.1/2222' 2>/dev/null; then
        # Connection is alive - nothing to do
        echo "[$TIMESTAMP] OK - Tunnel alive and responding" >> "$LOG"
    else
        # Port listening but not responding - stale tunnel
        echo "[$TIMESTAMP] WARNING - Stale tunnel detected, cleaning up" >> "$LOG"
        # Find and kill the stale sshd process holding port 2222
        STALE_PID=$(ss -tulnp | grep ':2222' | grep -oP 'pid=\K[0-9]+' | head -1)
        if [ -n "$STALE_PID" ]; then
            kill "$STALE_PID" 2>/dev/null
            echo "[$TIMESTAMP] Killed stale process $STALE_PID" >> "$LOG"
        fi
    fi
else
    echo "[$TIMESTAMP] WARNING - No tunnel detected on port 2222" >> "$LOG"
fi

# Rotate log - keep last 500 lines
if [ -f "$LOG" ] && [ $(wc -l < "$LOG") -gt 500 ]; then
    tail -200 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
fi
