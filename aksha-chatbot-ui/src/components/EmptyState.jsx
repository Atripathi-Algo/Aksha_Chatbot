import { Box, Stack, Typography } from '@mui/material';
import { ArrowRight } from 'lucide-react';
import { color, font, radius } from '../tokens';
import { suggestedQuestions } from '../data/mockConversation';

export default function EmptyState({ onPick }) {
  return (
    <Box sx={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography sx={{ font: `800 20px/1.3 ${font.heading}`, letterSpacing: '-0.01em', mb: 1 }}>
          Hello, I'm the Aksha support assistant.
        </Typography>
        <Typography sx={{ font: `400 13px/1.6 ${font.body}`, color: color.neutral800 }}>
          I'm happy to help with alerts, camera configuration, live status, and incident history, in English or हिंदी. Every answer shows its sources — please feel free to ask me anything.
        </Typography>
      </Box>
      <Stack gap="7px">
        {suggestedQuestions.map((q) => (
          <Box
            key={q}
            component="button"
            onClick={() => onPick?.(q)}
            sx={{
              all: 'unset', cursor: 'pointer', background: color.neutral100, borderRadius: `${radius.cardSm}px`,
              padding: '13px 14px', font: `500 13px/1.4 ${font.body}`, display: 'flex', justifyContent: 'space-between', gap: 1,
              '&:hover': { background: color.accent100 },
            }}
          >
            {q}
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', color: color.accent }}>
              <ArrowRight size={15} />
            </Box>
          </Box>
        ))}
      </Stack>
      <Typography sx={{ mt: 'auto', font: `400 11.5px/1.5 ${font.body}`, color: color.neutral700 }}>
        The assistant reads alerts, camera settings and site documentation. It cannot change settings without your confirmation.
      </Typography>
    </Box>
  );
}
