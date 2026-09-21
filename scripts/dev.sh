#!/usr/bin/env sh
set -e

# Expo only prints its QR code when it owns a TTY, so it stays in the foreground
# and the API and web servers run behind it.
pnpm exec concurrently -k -n api,web -c yellow,cyan "pnpm run dev:server" "pnpm run dev:web" &
servers=$!

trap 'kill "$servers" 2>/dev/null' EXIT INT TERM

pnpm run dev:mobile
