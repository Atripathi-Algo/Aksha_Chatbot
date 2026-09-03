# Aksha Chatbot UI — test harness

Standalone React + MUI v5 implementation of the chatbot panel, built from the
design handoff in `../aksha-chatbot-ui-design/handoff/`. Runs on its own port
(5173) so it can be reviewed independently of the main Aksha frontend (:3000).

## Run it

```bash
npm install
npm run dev
```

Opens at http://localhost:5173. Press **Alt+K** to toggle the panel open/closed.

## What's here

- Every message type from the design spec, driven by scripted mock data in
  `src/data/mockConversation.jsx`: cited answer, streaming, clarification,
  cached/last-known, degraded, escalation, approval request (not wired up),
  and rich outputs (table, bar, donut).
- Responsive shell: docked panel (desktop) → bottom sheet (<1100px) → full
  screen (<600px). Resize the window to check each.
- Agent directory dropdown (the "AGENTS" button in the header).
- A composer with EN/HI/MR language toggle.

## What's NOT wired up yet

- No connection to `aksha-chatbot-api` — sending a message appends a
  placeholder reply, not a real streamed answer. Swap `App.jsx`'s
  `appendOperatorAndPlaceholderReply` for a real SSE client once the backend
  exists.
- No auth (matches the current backend development decision — no auth during
  development).
- Approval actions, escalation ticket links, and export buttons are visual
  only.

## Known issue

React logs a dev-only console warning (`does not recognize the alignItems /
flexWrap prop`) that traces back to `react-dom` itself, not this codebase —
confirmed no `alignItems`/`flexWrap` prop exists outside an `sx={{}}` block
anywhere in `src/`, and no invalid attribute actually reaches the DOM. Looks
like a MUI v9 / React 19 compatibility quirk in this dependency combination.
Cosmetic only; if it's worth silencing, try pinning `@mui/material` to a
known-stable v6/v7 release instead of latest.

## Design source

`../aksha-chatbot-ui-design/handoff/` — read `README.md` there first. Tokens
in `src/tokens.js` and `src/theme.js` are copied from `02-spec/TOKENS.md`;
keep them in sync if the design spec changes.
