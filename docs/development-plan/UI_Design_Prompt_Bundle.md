# Aksha Support Chatbot — UI Design Prompt Bundle

How to use this: paste **Prompt 0 (Master Context)** first in a new conversation with the design tool. Then paste each numbered screen prompt one at a time, in order, so it designs each state with the master context already loaded. Every prompt asks for React + MUI code (matching the existing Aksha frontend stack), not static images, so output can be dropped into the codebase for testing.

---

## Prompt 0 — Master Context (paste first, always)

```
I'm designing the UI for a support chatbot inside Aksha, an existing video-surveillance
operator platform. You'll design one screen/state at a time across several follow-up
prompts — treat this message as shared context for all of them.

PRODUCT
Aksha lets security operators monitor cameras, review alerts, and investigate incidents.
We're adding an in-app chatbot so operators can ask questions in plain language instead of
navigating multiple screens. Example questions it answers:
- "Show all high-risk alerts from Camera 12 today."
- "Which cameras have email alerts enabled?"
- "Is anything happening right now near the loading bay?"
- "Which camera had the most alerts this month?"
- "Why didn't I receive an alert for Camera 7 this morning?"
- Same questions asked in Hindi or Marathi, expecting an answer in the same language.

USERS
Security operators and site administrators — not developers. Often monitoring multiple
camera feeds at once, so the chatbot is a secondary panel, never a full-screen takeover.
Tone: calm, precise, trustworthy — this is a security tool, not a consumer app. No
playful copy, no mascots, no excessive color.

EXISTING FRONTEND CONSTRAINTS (the design must fit these, not replace them)
- Stack: React, MUI v5 (Material UI) is the primary component library already used
  throughout the app. Some legacy screens use antd/bootstrap but MUI is the modern
  standard — design new components in MUI.
- There is already a working chat dialog component (ChatPopover.tsx) used in one part
  of the app (image analysis). It has: a dialog/popover shell, a message list with
  user/assistant bubbles, a text input with send button, and a "download chat" action.
  We are generalizing this component, not replacing it from scratch — so the new design
  should feel like an evolution of a popover-style chat panel, not a full rewrite.
- Light theme only for this phase (no dark mode needed yet).
- The rest of the app uses a fairly dense, data-heavy dashboard layout (camera grids,
  alert tables, charts). The chatbot panel should feel calmer and less dense than that,
  since its job is to reduce cognitive load, not add another data-dense surface.

FUNCTIONAL REQUIREMENTS THE UI MUST SUPPORT
1. Streaming responses — answers arrive token-by-token (Server-Sent Events), not all
   at once. The UI needs a visible "typing/streaming" state, not just a spinner.
2. Every evidence-based answer must show its sources — e.g. a specific alert ID, camera
   name, timestamp, or document section — as clickable citation chips near the answer,
   not just buried in the prose.
3. Clarification questions are a DISTINCT message type from normal answers — e.g. "Which
   camera did you mean — North Gate or North Gate 2?" — and should look visually
   different from a plain assistant reply so the operator immediately knows a response
   is expected.
4. Data freshness labels — some answers are about live state (e.g. "is Camera 14 online
   right now") and must visibly say whether the data is "live," "cached," or
   "last known at [time]" — this is a trust requirement, not a nice-to-have.
5. Multi-language support — an operator can type in Hindi/Marathi/English and the
   response comes back in the same language, but camera names, alert IDs, and
   timestamps stay untranslated. The UI should handle mixed-script text gracefully.
6. A "download this conversation" action (already exists in the current component,
   keep it).
7. Failure/degraded states — e.g. "the alert service isn't responding right now" —
   must read as informative, not alarming or broken.
8. (Design for, but visually de-emphasize for now) A future "approval required" message
   type, for when an action needs human confirmation before it executes — e.g. "I'm
   ready to disable email alerts for Camera 12 — confirm?" with Approve/Reject buttons.
   This won't be wired up yet but the visual language should have room for it later.

OUTPUT FORMAT FOR EVERY PROMPT BELOW
- Produce React functional components using MUI v5 components and the `sx` prop or
  MUI's styling solution (not raw CSS files, not Tailwind).
- Assume TypeScript is fine (the codebase mixes .tsx and .jsx).
- Include realistic example content in the mockup (use the example questions above,
  don't use lorem ipsum).
- Call out any new MUI theme tokens (colors, spacing) you introduce so they can be
  reconciled with the existing theme later.
- After the component code, add a short design-rationale paragraph explaining the key
  layout/interaction decisions — this is going straight to an engineering team, not a
  visual-only handoff.

Confirm you've got this context, then wait for the first screen prompt.
```

---

## Prompt 1 — Collapsed launcher + panel shell

```
Design the entry point and container shell for the chatbot.

1. A collapsed launcher — a small persistent affordance (e.g. floating action button or
   docked tab) that opens the chat panel. It should be visible from any screen in the
   app without covering camera feeds or alert data.
2. The expanded panel shell — the container the conversation lives inside. Decide:
   docked side panel vs. floating popover vs. bottom sheet, and justify the choice given
   operators are usually also watching live camera feeds and don't want the chatbot to
   fully obscure them.
3. An empty/first-open state — before the operator has asked anything. Should hint at
   what the chatbot can do without being a wall of text. Consider showing 2-3 example
   questions as clickable suggestions, drawn from the example list in the master context.

Include the open and closed states as two separate component states.
```

---

## Prompt 2 — Core conversation: message bubbles, streaming, citations

```
Design the core message-list experience.

1. User message bubble and assistant message bubble — establish the visual language
   (alignment, color, avatar/icon if any) that every other message type in this bundle
   will build on.
2. An assistant message actively streaming in — show what the UI looks like mid-response,
   not just the finished state. Make it clear the system is actively working, not frozen.
3. A completed assistant answer that cites evidence — design the citation-chip pattern
   for referencing a specific alert ID, camera name + timestamp, or document section.
   Show at least one example with 2-3 citations attached to one answer.
4. The same completed answer, but the data is explicitly labeled "cached" or
   "last known at 9:42 AM" instead of live — design how that freshness label attaches
   to an answer without competing visually with the citations.

Use the example question "Show all high-risk alerts from Camera 12 today" answered with
2 example alerts, each cited.
```

---

## Prompt 3 — Clarification, multi-turn filters, and language switching

```
Design three interaction patterns that extend the core message list from Prompt 2.

1. A clarification message — the assistant needs more information before it can answer
   (example: user asks "show alerts from yesterday" with multiple cameras available, and
   the assistant needs to know which camera). This must be visually distinct from a
   normal answer bubble.
2. Active filter/context chips — when a conversation has an implicit scope (e.g. "camera:
   North Gate", "date: today") carried across multiple turns, show how that's surfaced
   to the operator so they always know what scope their question is being answered in,
   and can clear or change it.
3. A short exchange conducted in Hindi (Devanagari script) — show that the layout and
   bubble design hold up with a non-Latin script and roughly show how a citation chip
   with an untranslated camera name/alert ID sits inside a non-English sentence.
```

---

## Prompt 4 — Degraded states, escalation, and the future approval pattern

```
Design the "something isn't straightforward" states.

1. A degraded-service message — e.g. the alerts backend is unavailable right now. Should
   read as calm and informative, include a correlation ID for support purposes, and
   avoid alarming red-error styling (this is a routine degraded state, not a crash).
2. An escalation confirmation — after the assistant collects context and hands off to a
   human/ticketing flow, show the confirmation message the operator sees, including
   what was captured (camera, alert ID, description) so they can verify it before it's
   sent.
3. The future approval-required message type (not wired up yet, but needs a visual home
   now) — e.g. "I'm ready to disable email alerts for Camera 12. Confirm?" with clear
   Approve / Reject actions and a visible expiry ("this request expires in 5 minutes").
   Make sure this reads as meaningfully more consequential than a normal answer or
   clarification message, since it's the one message type that changes real system state.
```

---

## Prompt 5 — Responsive behavior and accessibility pass

```
Take the components from Prompts 1-4 and address:

1. How the panel adapts on a smaller viewport (operators sometimes use a secondary
   monitor or a smaller laptop screen) — does it become a bottom sheet, a full-screen
   overlay, or something else? Justify the choice.
2. Keyboard navigation — tab order through the message list, input, and citation chips;
   how a keyboard-only user opens/closes the panel and activates a clarification
   response or an approval action.
3. Screen-reader behavior for the streaming message state specifically — streaming text
   is a known accessibility trap (screen readers re-announcing partial content on every
   token). Propose an approach (e.g. aria-live="polite" with a completion announcement
   rather than announcing every token).
4. Color contrast check on the citation chips, freshness labels, and the approval-request
   state against the light theme — flag anything that wouldn't pass WCAG AA.
```
