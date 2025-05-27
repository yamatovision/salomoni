import React, { useState } from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Button,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Fade,
} from '@mui/material';
import type { BirthTimeData } from '../types';

interface BirthTimeFormProps {
  onSubmit: (data: BirthTimeData) => void;
}

export const BirthTimeForm: React.FC<BirthTimeFormProps> = ({ onSubmit }) => {
  const [hasTime, setHasTime] = useState(true);
  const [hour, setHour] = useState<number | ''>('');
  const [minute, setMinute] = useState<number | ''>('');

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minute options (0-55, 5分刻み)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleSubmit = () => {
    if (!hasTime) {
      onSubmit({ hasTime: false });
    } else if (hour !== '' && minute !== '') {
      onSubmit({
        hasTime: true,
        hour: hour as number,
        minute: minute as number,
      });
    }
  };

  const isValid = !hasTime || (hour !== '' && minute !== '');

  return (
    <Fade in={true}>
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          border: '2px solid #F26A8D',
          boxShadow: '0 4px 15px rgba(242, 106, 141, 0.1)',
          bgcolor: 'white',
        }}
      >
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#F26A8D',
            mb: 3,
            textAlign: 'center',
          }}
        >
          出生時間を選択してください
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <RadioGroup
            row
            value={hasTime ? 'known' : 'unknown'}
            onChange={(e) => setHasTime(e.target.value === 'known')}
            sx={{ mb: 1 }}
          >
            <FormControlLabel
              value="known"
              control={
                <Radio
                  sx={{
                    color: '#E298A4',
                    '&.Mui-checked': { color: '#F26A8D' },
                  }}
                />
              }
              label="時間がわかる"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontWeight: 500,
                  color: '#374151',
                },
              }}
            />
            <FormControlLabel
              value="unknown"
              control={
                <Radio
                  sx={{
                    color: '#E298A4',
                    '&.Mui-checked': { color: '#F26A8D' },
                  }}
                />
              }
              label="わからない"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontWeight: 500,
                  color: '#374151',
                },
              }}
            />
          </RadioGroup>

          {hasTime && (
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                justifyContent: 'center',
              }}
            >
              <FormControl size="small">
                <Select
                  value={hour}
                  onChange={(e) => setHour(e.target.value as number)}
                  displayEmpty
                  sx={{
                    minWidth: 80,
                    borderRadius: 2.5,
                    bgcolor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2,
                      borderColor: '#e2e8f0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F26A8D',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F26A8D',
                    },
                  }}
                >
                  <MenuItem value="">時</MenuItem>
                  {hourOptions.map((h) => (
                    <MenuItem key={h} value={h}>
                      {h.toString().padStart(2, '0')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                :
              </Typography>

              <FormControl size="small">
                <Select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value as number)}
                  displayEmpty
                  sx={{
                    minWidth: 80,
                    borderRadius: 2.5,
                    bgcolor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2,
                      borderColor: '#e2e8f0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F26A8D',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F26A8D',
                    },
                  }}
                >
                  <MenuItem value="">分</MenuItem>
                  {minuteOptions.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m.toString().padStart(2, '0')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isValid}
            sx={{
              bgcolor: '#F26A8D',
              color: 'white',
              borderRadius: 25,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(242, 106, 141, 0.3)',
              '&:hover': {
                bgcolor: '#e11d48',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(242, 106, 141, 0.4)',
              },
              '&:disabled': {
                bgcolor: '#cbd5e1',
                transform: 'none',
                boxShadow: 'none',
              },
            }}
          >
            決定
          </Button>
        </Box>
      </Paper>
    </Fade>
  );
};