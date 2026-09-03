// Design tokens for the Aksha chatbot panel.
// Source of truth: aksha-chatbot-ui-design/handoff/02-spec/TOKENS.md
// Do not hand-tune values here without updating that file too.

export const color = {
  accent: '#326BC9',
  accent100: '#eef3fc',
  accent200: '#d6e3f7',
  accent300: '#b3caf0',
  accent500: '#4176cd',
  accent700: '#1f4788',
  accent800: '#163364',

  ink: '#1b2029',
  ground: '#f4f5f7',
  surface: '#e8eaee',

  neutral100: '#fbfbfc',
  neutral200: '#e6e8ec',
  neutral300: '#d0d4db',
  neutral400: '#b2b7c0',
  neutral500: '#92979f',
  neutral600: '#757a83',
  neutral700: '#595e66',
  neutral800: '#3d4149',

  divider: 'rgba(27,32,41,0.4)',
};

export const font = {
  heading: '"Archivo", system-ui, sans-serif',
  body: '"Archivo", system-ui, sans-serif',
  mono: 'ui-monospace, Menlo, Consolas, monospace',
};

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
};

export const shadowSm = '0 1px 2px rgba(27,32,41,0.12)';
export const shadowMd = '0 3px 10px rgba(27,32,41,0.16)';
export const shadowLg = '0 12px 32px rgba(27,32,41,0.22)';

export const panel = {
  width: 440,
  bottomSheetHeight: '64vh',
};

// v3.0 chatbot redesign — soft/rounded surface, deliberately departing from
// the flat zero-radius Modernist system used by the rest of the dashboard.
// See docs/development-plan/Claude_Design_Prompt_Live_Agents.md and the
// Claude Design handoff (02-spec/TOKENS.md, AGENTS.md) this was built from.
export const radius = {
  panel: 14,
  card: 12,
  cardSm: 10,
  tile: 8,
  hover: 8,
  pill: 99,
  bubble: '12px 12px 4px 12px', // asymmetric — sharp bottom-right notch
};
