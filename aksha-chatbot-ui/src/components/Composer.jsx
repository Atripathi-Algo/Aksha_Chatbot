import { useState } from 'react';
import { Box, Stack } from '@mui/material';
import { ArrowUp } from 'lucide-react';
import { color, font, radius } from '../tokens';

// Bilingual for now (EN/HI only) — Marathi support is deferred, not removed;
// re-add an { code: 'MR', label: 'मर' } entry here when it's ready.
const LANGS = [
  { code: 'EN', label: 'EN' },
  { code: 'HI', label: 'हिं' },
];

export default function Composer({ onSend, placeholder = 'Ask about alerts, cameras or events…' }) {
  const [value, setValue] = useState('');
  const [lang, setLang] = useState('EN');
  const [focused, setFocused] = useState(false);

  const send = () => {
    if (!value.trim()) return;
    onSend?.(value, lang);
    setValue('');
  };

  return (
    <Box sx={{ borderTop: `1px solid ${color.neutral200}`, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Stack direction="row" gap="4px" sx={{ alignSelf: 'flex-start' }}>
        {LANGS.map((l) => (
          <Box
            key={l.code}
            component="button"
            onClick={() => setLang(l.code)}
            sx={{
              all: 'unset', cursor: 'pointer', padding: '4px 8px', borderRadius: `${radius.pill}px`,
              font: `600 9.5px/1 ${font.body}`,
              background: lang === l.code ? color.accent100 : 'transparent',
              color: lang === l.code ? color.accent700 : color.neutral600,
            }}
          >
            {l.label}
          </Box>
        ))}
      </Stack>
      <Box
        sx={{
          border: `1px solid ${focused ? color.accent : color.neutral300}`,
          borderRadius: `${radius.cardSm}px`, padding: '9px 11px',
          display: 'flex', alignItems: 'center', gap: '9px',
          boxShadow: focused ? `0 0 0 3px ${color.accent100}` : 'none',
          transition: 'box-shadow 120ms, border-color 120ms',
        }}
      >
        <Box
          component="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          aria-label="Message Aksha assistant"
          sx={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: 0,
            font: `400 12.5px/1.3 ${font.body}`, color: color.ink,
            '&::placeholder': { color: color.neutral600 },
          }}
        />
        <Box
          component="button"
          onClick={send}
          aria-label="Send message"
          sx={{
            all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: '7px', flex: 'none',
            background: color.accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowUp size={15} strokeWidth={2.4} />
        </Box>
      </Box>
    </Box>
  );
}
