import { createTheme } from '@mui/material/styles';
import { color, font } from './tokens';

// MUI mapping per TOKENS.md v3.0. The chatbot surface is deliberately soft/
// rounded (radius 10 default) — a departure from the flat zero-radius
// Modernist system used elsewhere in the dashboard, scoped to the chatbot
// only. Since this whole app IS the chatbot panel harness, that default
// applies globally here.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: color.accent, dark: color.accent700 },
    background: { default: color.ground, paper: color.neutral100 },
    text: { primary: color.ink, secondary: color.neutral700 },
    divider: color.divider,
  },
  typography: {
    fontFamily: font.body,
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
    },
    MuiCssBaseline: {
      styleOverrides: {
        ':focus-visible': {
          outline: `2px solid ${color.accent}`,
          outlineOffset: '2px',
        },
      },
    },
  },
});

export default theme;
