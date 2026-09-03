# Aksha Support Chatbot — Design Handoff Package

Everything needed to rebuild this chatbot UI from scratch, in build order.
Approved direction: **option 3a — "ruled ledger"**, with the agent and chart
work from options 4a–4c. Palette derived from the Aksha app mark (#326BC9).

## Read in this order

| # | Path | What it is |
|---|------|-----------|
| 1 | `01-brief/UI_Design_Prompt_Bundle.md` | Original product brief: users, constraints, the 8 functional requirements |
| 2 | `02-spec/design-handoff-standalone.html` | **The specification.** Open in a browser; print to PDF. Decisions, message-type ladder, agents, output types, a11y, tokens |
| 3 | `02-spec/TOKENS.md` | Copy-paste token values + MUI theme mapping |
| 4 | `03-mockups/mockups-standalone.html` | **The mockups.** Offline, self-contained. Four turns; newest at top. Turn 3 = approved shell + full thread, turn 4 = agents + table/bar/pie |
| 5 | `04-design-system/` | Modernist design system: the single stylesheet + its guide (source of every colour, type and spacing rule) |
| 6 | `05-assets/` | Aksha app mark; the agent inventory the UI was built for |

## Where to look in the mockups

Ids are stable and referenced throughout the spec.

- **3a** — the complete thread: cited answer with frames, streaming, clarification, Hindi exchange, cached answer, degraded, escalation, approval
- **3b** — docked in the operator dashboard at 1180px
- **3c** — shell states: closed tab, unread tab, first-open, small-viewport bottom sheet
- **3d** — condensed handoff notes
- **4a** — agent attribution + the 8-agent directory
- **4b** — rich output types: table, bar chart, donut
- **4c** — multi-agent answers, error-code agent, Marathi answer
- **2a / 2b / 2c** — the three directions considered; 2b (answer-as-object) and 2c (poster gutter) are *rejected*, kept for context
- **turn 1** — first exploration, superseded

## Build notes

- Stack: React + MUI v5, `sx` styling. Evolution of the existing `ChatPopover.tsx`
  (dialog shell, message list, input, download action) — not a rewrite.
- Light theme only for this phase. `shape.borderRadius = 0` **inside the panel only**.
- Icons: Lucide, inline SVG on `currentColor` — 15px in chrome, 11px in chips.
- Frames in the mockups are drop-target placeholders. Real frames render 16:9,
  180–200px wide, grayscale, with an alert-ID + time caption strip.
- Charts are plain SVG/CSS, no chart library required at these sizes. Series colours
  are accent ramp steps 800 / 500 / 200 only, so they stay legible in grayscale.

## Editing the mockups

`03-mockups/source/` holds the editable original (`.dc.html` + `support.js` +
`image-slot.js`). `mockups-standalone.html` is a compiled artefact — edit the
source and re-compile, never the bundle. The design-system stylesheet is expected
at `_ds/modernist-<id>/styles.css` relative to the source file; a copy is in
`04-design-system/`.

## Not in scope yet

Mobile application designs (next, once 3a is signed off) · approval wiring ·
manual agent override · conversation retention rules.
