import React, { useState } from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Fade,
} from '@mui/material';
import type { BirthPlaceData } from '../types';

interface BirthPlaceFormProps {
  onSubmit: (data: BirthPlaceData) => void;
}

const JAPAN_PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

export const BirthPlaceForm: React.FC<BirthPlaceFormProps> = ({ onSubmit }) => {
  const [locationType, setLocationType] = useState<'japan' | 'overseas'>('japan');
  const [japanLocation, setJapanLocation] = useState('');
  const [overseasLocation, setOverseasLocation] = useState('');

  const handleSubmit = () => {
    const location = locationType === 'japan' ? japanLocation : overseasLocation;
    if (location) {
      onSubmit({
        locationType,
        location,
      });
    }
  };

  const isValid = locationType === 'japan' ? japanLocation !== '' : overseasLocation !== '';

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
          出生地を選択してください
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <RadioGroup
            row
            value={locationType}
            onChange={(e) => setLocationType(e.target.value as 'japan' | 'overseas')}
            sx={{ mb: 1 }}
          >
            <FormControlLabel
              value="japan"
              control={
                <Radio
                  sx={{
                    color: '#E298A4',
                    '&.Mui-checked': { color: '#F26A8D' },
                  }}
                />
              }
              label="日本国内"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontWeight: 500,
                  color: '#374151',
                },
              }}
            />
            <FormControlLabel
              value="overseas"
              control={
                <Radio
                  sx={{
                    color: '#E298A4',
                    '&.Mui-checked': { color: '#F26A8D' },
                  }}
                />
              }
              label="海外"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontWeight: 500,
                  color: '#374151',
                },
              }}
            />
          </RadioGroup>

          {locationType === 'japan' ? (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={japanLocation}
                onChange={(e) => setJapanLocation(e.target.value)}
                displayEmpty
                sx={{
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
                <MenuItem value="">都道府県を選択</MenuItem>
                {JAPAN_PREFECTURES.map((prefecture) => (
                  <MenuItem key={prefecture} value={prefecture}>
                    {prefecture}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              size="small"
              value={overseasLocation}
              onChange={(e) => setOverseasLocation(e.target.value)}
              placeholder="国名と都市名を入力 (例: アメリカ ニューヨーク)"
              sx={{
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  bgcolor: '#f8fafc',
                  '& fieldset': {
                    borderWidth: 2,
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#F26A8D',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#F26A8D',
                  },
                },
              }}
            />
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