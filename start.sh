#!/usr/bin/env bash
set -euo pipefail

# Start Next.js in background, bound to loopback only
PORT=3001 npm run start -- -H 127.0.0.1 &
NEXT_PID=$!

# Give Next.js a moment to bind, then start Caddy in foreground
caddy run --config Caddyfile --adapter caddyfile &
CADDY_PID=$!

# Exit if either child dies — the hosting provider restarts the container
trap 'kill $NEXT_PID $CADDY_PID 2>/dev/null; exit 1' SIGTERM SIGINT

wait -n
exit 1
