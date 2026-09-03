# Aksha Support Chatbot

A FastAPI + LangGraph chatbot service (`aksha-chatbot-api`) and its React/Vite
UI test harness (`aksha-chatbot-ui`), built to answer operator questions
about cameras, alerts, notifications, and insights by calling the existing
Aksha Node backend's own APIs — no direct database access, no invented data.

Split out from the main Aksha monorepo so the chatbot can be developed,
reviewed, and deployed independently.

## Contents

- `aksha-chatbot-api/` — the chatbot service (router, agents, tools, formatter)
- `aksha-chatbot-ui/` — React/Vite chat panel + operator-dashboard test harness
- `aksha-chatbot-ui-design/` — design handoff (tokens, mockups, specs) the UI was built from
- `docs/CHATBOT_SYSTEM_ARCHITECTURE.md` — the system design doc (state, contracts, phases, build log)
- `docs/SUPPORT_CHATBOT_AGENT_CATALOG.md` — per-agent responsibilities and tool ownership
- `docs/development-plan/` — build plans, evaluation results, and vertical-specific (healthcare) use-case research
- `docker-compose.chatbot.yml` + `chatbot.env.example` — plug-and-play deployment onto a machine already running the real Aksha stack

## Running it

```bash
cp chatbot.env.example chatbot.env   # fill in GROQ_API_KEY or OLLAMA_*, adjust ports if needed
docker compose -f docker-compose.chatbot.yml --env-file chatbot.env up -d --build
```

This expects the real Aksha stack's `aksha-net` Docker network to already
exist on the target machine (see `docker-compose.chatbot.yml`'s comments for
the non-Docker-Aksha fallback).

## Local development (without Docker)

```bash
# API
cd aksha-chatbot-api
python -m venv venv && venv\Scripts\activate   # or source venv/bin/activate on Linux/macOS
pip install -r requirements.txt
cp .env.example .env   # fill in provider/keys
uvicorn app.main:app --reload --port 8010

# UI
cd aksha-chatbot-ui
npm install
npm run dev
```
