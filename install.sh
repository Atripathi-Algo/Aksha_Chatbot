#!/usr/bin/env bash
# Aksha Chatbot — one-click installer for Linux.
#
# Run this on a machine that already has the real Aksha stack running in
# Docker (react_frontend :3000, node_backend :5000, service_api :4000,
# mongodb :27017, all on the `aksha-net` network). This script builds and
# starts the chatbot's two containers on that same network so they can reach
# node_backend by container name — no manual host/IP configuration.
#
# Usage:
#   ./install.sh
# First run: copies chatbot.env.example to chatbot.env and stops so you can
# fill in your LLM provider settings. Re-run after editing to actually build
# and start the stack. Safe to re-run any time after that — it just rebuilds
# and restarts.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

COMPOSE_FILE="docker-compose.chatbot.yml"
ENV_FILE="chatbot.env"
ENV_TEMPLATE="chatbot.env.example"
NETWORK="aksha-net"

info()  { printf '\033[1;34m[chatbot]\033[0m %s\n' "$1"; }
warn()  { printf '\033[1;33m[chatbot]\033[0m %s\n' "$1"; }
fail()  { printf '\033[1;31m[chatbot]\033[0m %s\n' "$1" >&2; exit 1; }

# --- 1. Docker present? ---
command -v docker >/dev/null 2>&1 || fail "Docker isn't installed. Install it first: https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1 || fail "The 'docker compose' plugin isn't available. Install it (usually bundled with recent Docker Engine) and re-run."

# --- 2. The real Aksha stack's network exists? ---
if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
    warn "Docker network '$NETWORK' doesn't exist yet."
    warn "This chatbot expects the real Aksha stack (node_backend, etc.) to already be running on that network."
    warn "If Aksha isn't deployed via Docker on this machine, this script isn't the right path — see README.md's"
    warn "'non-Docker Aksha' note (point NODE_API_BASE_URL at host.docker.internal instead) and run"
    warn "docker compose manually rather than via this script."
    read -r -p "Create an empty '$NETWORK' network and continue anyway? [y/N] " reply
    [[ "$reply" =~ ^[Yy]$ ]] || fail "Aborted — start the Aksha stack first, then re-run."
    docker network create "$NETWORK"
fi

# --- 3. Config file present? ---
if [[ ! -f "$ENV_FILE" ]]; then
    cp "$ENV_TEMPLATE" "$ENV_FILE"
    warn "Created $ENV_FILE from the template — it needs your LLM provider settings before this will work."
    warn "Edit it now: set CHATBOT_MODEL_PROVIDER (groq or ollama) and the matching GROQ_API_KEY or OLLAMA_* values."
    warn "Then re-run ./install.sh to build and start the chatbot."
    exit 0
fi

# --- 4. Build and start ---
info "Building and starting the chatbot containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

# --- 5. Wait for health, then report ---
info "Waiting for both containers to report healthy..."
for i in $(seq 1 30); do
    api_status=$(docker inspect -f '{{.State.Health.Status}}' aksha-chatbot-api 2>/dev/null || echo "starting")
    ui_status=$(docker inspect -f '{{.State.Health.Status}}' aksha-chatbot-ui 2>/dev/null || echo "starting")
    if [[ "$api_status" == "healthy" && "$ui_status" == "healthy" ]]; then
        break
    fi
    sleep 2
done

if [[ "${api_status:-}" != "healthy" || "${ui_status:-}" != "healthy" ]]; then
    warn "Containers started but haven't reported healthy yet (api: ${api_status:-unknown}, ui: ${ui_status:-unknown})."
    warn "Check logs with: docker compose -f $COMPOSE_FILE logs -f"
else
    ui_port=$(grep -E '^CHATBOT_UI_PORT=' "$ENV_FILE" | cut -d= -f2)
    ui_port="${ui_port:-8080}"
    info "Done. Open http://<this-machine>:${ui_port} to use the chatbot."
fi
