# Tokens — Aksha chatbot panel

Derived from the Aksha app mark. Structure follows the Modernist system
(flat, zero radius, 2px rules, Archivo) — see `../04-design-system/modernist-readme.md`.

## Colour

| Role | Value | Use |
|---|---|---|
| accent / primary | `#326BC9` | primary action, streaming rule, accent bands, identifier underline |
| accent-100 | `#eef3fc` | clarification field |
| accent-200 | `#d6e3f7` | hover on option rows, live-agent directory tiles, chart series 3 |
| accent-300 | `#b3caf0` | clarification box inner rule |
| accent-500 | `#4176cd` | chart series 2 |
| accent-700 | `#1f4788` | accent-coloured body text (AA), agent badge text |
| accent-800 | `#163364` | chart series 1 |
| ink / text | `#1b2029` | all body copy, 2px rules, chip borders |
| ground | `#f4f5f7` | panel background |
| surface | `#e8eaee` | operator message fill |
| neutral-100 | `#fbfbfc` | header, composer, card grounds |
| neutral-200 | `#e6e8ec` | degraded field, chart track |
| neutral-300 | `#d0d4db` | correlation-ref chip |
| neutral-600 | `#757a83` | meta labels, degraded border |
| neutral-700 | `#595e66` | freshness labels (5.1:1) |
| divider | `#1b2029` @ 40% | 1px row rules, answer left marker |

## Type — Archivo

| Role | Spec |
|---|---|
| Body | 13.5px / 1.6 · 400 (Devanagari: 14px / 1.75) |
| Meta label | 9.5px / 700 · uppercase · letter-spacing .16em |
| Chrome label | 11px / 700 · uppercase · letter-spacing .14em |
| Chip | 10px / 600 · letter-spacing .06em |
| Display (empty state) | 22px / 1.2 · 800 · letter-spacing -.01em |
| Mono (endpoints, refs) | ui-monospace 9.5–10px |

## Geometry

- Radius: `0` everywhere inside the panel.
- Rules: 2px ink between regions; 1px `divider` between message rows.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32. Panel gutter 16px.
- Panel width 420px docked · bottom sheet 64% viewport height · full screen < 600px.
- Touch targets 44px minimum below 600px.

## MUI mapping

```ts
palette.primary.main            = '#326BC9'
palette.chat.userFill           = '#e8eaee'
palette.chat.rule               = '#1b2029'   // 2px
palette.evidence.chipBorder     = '#1b2029'   // 1px, dashed when cached
palette.freshness.live          = '#326BC9'
palette.freshness.cached        = '#595e66'
palette.chart.series            = ['#163364', '#4176cd', '#d6e3f7']
palette.approval.band           = { bg: '#326BC9', text: '#fbfbfc' }
shape.borderRadius              = 0           // panel scope only
typography.fontFamily           = 'Archivo, system-ui, sans-serif'
```

## Contrast (light theme, ground #f4f5f7)

| Pair | Ratio | Verdict |
|---|---|---|
| ink on ground | 14.1:1 | pass |
| accent on ground | 4.6:1 | pass AA for 10px+ label text |
| white on accent band | 4.6:1 | pass for 10px bold and up |
| neutral-700 on ground | 5.1:1 | pass — do not lighten freshness labels |

Focus: `:focus-visible { outline: 2px solid #326BC9; outline-offset: 2px }` — never the browser default.
