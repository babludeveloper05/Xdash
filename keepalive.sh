#!/bin/bash
# keepalive.sh — respawn Next.js if it dies.
# The sandbox kills idle processes; this script detects the death and
# restarts within 2 seconds. Run with: setsid bash keepalive.sh &
cd /home/z/my-project
while true; do
  if ! curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "[$(date)] Next.js down — restarting..."
    pkill -f "bun run dev" 2>/dev/null
    sleep 1
    bun run dev > dev.log 2>&1 &
    echo "[$(date)] Next.js restarted (PID $!)"
    sleep 5
  fi
  sleep 3
done
