import { Box, Stack, Typography } from '@mui/material';
import { X } from 'lucide-react';
import { color, font, radius } from '../tokens';
import { ActionButton } from './shared';

export default function ScopeChips({ scope, onClear, onRemove }) {
  if (!scope?.length) return null;
  return (
    <Stack
      direction="row" gap={1}
      sx={{ alignItems: "center", flexWrap: "wrap",  padding: '10px 14px', borderBottom: `1px solid ${color.neutral200}` }}
    >
      <Typography sx={{ font: `600 9.5px/1 ${font.body}`, color: color.neutral700 }}>
        Scope
      </Typography>
      {scope.map((s) => (
        <Box
          key={s.label}
          sx={{ borderRadius: `${radius.pill}px`, background: color.accent100, padding: '4px 8px', font: `500 10.5px/1 ${font.body}`, color: color.accent700, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {s.label}
          <Box
            component="button"
            onClick={() => onRemove?.(s)}
            aria-label={`Clear ${s.label} filter`}
            sx={{ all: 'unset', display: 'inline-flex', cursor: 'pointer', color: color.accent700 }}
          >
            <X size={11} />
          </Box>
        </Box>
      ))}
      <ActionButton onClick={onClear}>Clear</ActionButton>
    </Stack>
  );
}
