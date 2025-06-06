import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Stack,
  Chip,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface DayPillarInfo {
  heavenlyStem: string;
  earthlyBranch: string;
  element: string;
  yinYang: string;
  ganZhi: string;
}

interface DayPillarCardProps {
  dayPillar: DayPillarInfo;
  date?: Date | string;
}

// スタイル付きコンポーネント
const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)',
  borderRadius: '20px',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '120px',
    height: '120px',
    background: 'radial-gradient(circle, rgba(242, 106, 141, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    transform: 'translate(30px, -30px)',
  }
}));

const GanZhiDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '48px',
  fontWeight: 700,
  color: theme.palette.primary.main,
  fontFamily: '"Noto Serif JP", serif',
  marginBottom: theme.spacing(2),
  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
}));

const InfoBox = styled(Box)(({ theme }) => ({
  background: 'rgba(255,255,255,0.8)',
  borderRadius: '12px',
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
}));

const ElementChip = styled(Chip)<{ element: string }>(({ element }) => {
  const elementColors: Record<string, { bg: string; text: string }> = {
    '木': { bg: '#e8f5e9', text: '#2e7d32' },
    '火': { bg: '#ffebee', text: '#c62828' },
    '土': { bg: '#fff3e0', text: '#e65100' },
    '金': { bg: '#f3e5f5', text: '#6a1b9a' },
    '水': { bg: '#e3f2fd', text: '#1565c0' }
  };

  const colors = elementColors[element] || { bg: '#f5f5f5', text: '#666' };

  return {
    backgroundColor: colors.bg,
    color: colors.text,
    fontWeight: 600,
    borderRadius: '16px',
  };
});

const YinYangIndicator = styled(Box)<{ type: '陰' | '陽' }>(({ type }) => ({
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  background: type === '陽' 
    ? 'linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%)' 
    : 'linear-gradient(135deg, #616161 0%, #212121 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '12px',
  fontWeight: 'bold',
}));

const DayPillarCard: React.FC<DayPillarCardProps> = ({ dayPillar, date }) => {
  const formatDate = (dateValue: Date | string | undefined) => {
    if (!dateValue) return '今日';
    const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return dateObj.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <StyledCard>
      <CardContent>
        <Typography 
          variant="overline" 
          color="text.secondary" 
          sx={{ 
            display: 'block', 
            textAlign: 'center',
            mb: 1,
            letterSpacing: 2
          }}
        >
          {formatDate(date)}の日柱
        </Typography>

        <GanZhiDisplay>
          {dayPillar.ganZhi}
        </GanZhiDisplay>

        <Stack spacing={1.5}>
          <InfoBox>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                天干
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {dayPillar.heavenlyStem}
              </Typography>
            </Box>
          </InfoBox>

          <InfoBox>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                地支
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {dayPillar.earthlyBranch}
              </Typography>
            </Box>
          </InfoBox>

          <InfoBox>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                五行
              </Typography>
              <ElementChip 
                element={dayPillar.element} 
                label={dayPillar.element} 
                size="small"
              />
            </Box>
          </InfoBox>

          <InfoBox>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                陰陽
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <YinYangIndicator type={dayPillar.yinYang as '陰' | '陽'}>
                  {dayPillar.yinYang === '陽' ? '☯' : '☯'}
                </YinYangIndicator>
                <Typography variant="body1" fontWeight={600}>
                  {dayPillar.yinYang}
                </Typography>
              </Box>
            </Box>
          </InfoBox>
        </Stack>

        <Box 
          sx={{ 
            mt: 2, 
            pt: 2, 
            borderTop: 1, 
            borderColor: 'divider',
            textAlign: 'center'
          }}
        >
          <Tooltip title="日柱は一日の基本的なエネルギーを表します">
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ cursor: 'help' }}
            >
              日柱は毎日0時に切り替わります
            </Typography>
          </Tooltip>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default DayPillarCard;