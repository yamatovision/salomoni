import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Button,
  Typography,
  Paper,
  Fade,
} from '@mui/material';
import type { BirthDateData } from '../types';

interface BirthDateFormProps {
  onSubmit: (data: BirthDateData) => void;
}

export const BirthDateForm: React.FC<BirthDateFormProps> = ({ onSubmit }) => {
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [day, setDay] = useState<number | ''>('');

  // Generate year options (1950-2010)
  const yearOptions = Array.from({ length: 61 }, (_, i) => 2010 - i);
  
  // Generate month options (1-12)
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Generate day options based on selected month and year
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };
  
  const dayOptions = year && month
    ? Array.from({ length: getDaysInMonth(year as number, month as number) }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1);

  // Demo data auto-fill
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      setTimeout(() => {
        setYear(1990);
        setMonth(5);
        setDay(15);
      }, 300);
    }
  }, []);

  const handleSubmit = () => {
    if (year && month && day) {
      onSubmit({
        year: year as number,
        month: month as number,
        day: day as number,
      });
    }
  };

  const isValid = year !== '' && month !== '' && day !== '';

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
          生年月日を選択してください
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <FormControl size="small">
            <Select
              value={year}
              onChange={(e) => setYear(e.target.value as number)}
              sx={{
                minWidth: 100,
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
              <MenuItem value="">年</MenuItem>
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <Select
              value={month}
              onChange={(e) => setMonth(e.target.value as number)}
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
              <MenuItem value="">月</MenuItem>
              {monthOptions.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <Select
              value={day}
              onChange={(e) => setDay(e.target.value as number)}
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
              <MenuItem value="">日</MenuItem>
              {dayOptions.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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