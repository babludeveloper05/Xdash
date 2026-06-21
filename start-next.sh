#!/bin/bash
# start-next.sh — starts Next.js and NEVER exits.
# The script stays alive (via `wait`), keeping its child process alive.
# This is the key difference: the parent doesn't exit, so the sandbox
# can't reap the child.
cd /home/z/my-project

export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0

# Start Next.js in the background
node .next/standalone/server.js > dev.log 2>&1 &
NEXT_PID=$!
echo "Next.js started (PID: $NEXT_PID)"

# Wait for it to be ready
sleep 3
if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
  echo "Next.js is ready on port 3000"
else
  echo "Next.js failed to start"
  exit 1
fi

# NEVER EXIT — keep the parent alive so the child survives
# The sandbox kills processes when their parent exits, so we block forever.
wait $NEXT_PID
