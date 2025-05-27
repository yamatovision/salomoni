import React from 'react';
import { Box, Typography } from '@mui/material';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepTitle,
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        right: { xs: 16, md: 32 },
        bgcolor: 'rgba(226, 152, 164, 0.1)',
        border: '1px solid rgba(226, 152, 164, 0.3)',
        borderRadius: 20,
        px: 2,
        py: 0.5,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: '#E298A4',
          fontWeight: 500,
          fontSize: { xs: '0.8rem', md: '0.9rem' },
        }}
      >
        {stepTitle} ({currentStep}/{totalSteps})
      </Typography>
    </Box>
  );
};