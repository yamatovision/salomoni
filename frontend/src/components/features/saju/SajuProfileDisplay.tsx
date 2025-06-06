import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  AutoAwesome,
  AccountBalance,
  LocalFireDepartment,
  Park,
  Diamond,
  Water,
} from '@mui/icons-material';

interface SajuProfileDisplayProps {
  profile: any;
  userName: string;
}

// 五行のアイコンと色を取得
const getElementIcon = (element: string) => {
  const icons: Record<string, JSX.Element> = {
    '木': <Park />,
    '火': <LocalFireDepartment />,
    '土': <AccountBalance />,
    '金': <Diamond />,
    '水': <Water />,
  };
  return icons[element] || <AutoAwesome />;
};

const getElementColor = (element: string) => {
  const colors: Record<string, string> = {
    '木': '#4CAF50',
    '火': '#F44336',
    '土': '#795548',
    '金': '#9E9E9E',
    '水': '#2196F3',
  };
  return colors[element] || '#757575';
};

export const SajuProfileDisplay: React.FC<SajuProfileDisplayProps> = ({ profile, userName }) => {
  if (!profile) return null;

  return (
    <Box sx={{ p: 2 }}>
      {/* 基本情報 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" />
          基本情報
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">氏名</Typography>
            <Typography variant="body1">{userName}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">生年月日</Typography>
            <Typography variant="body1">
              {profile.client?.birthDate || profile.user?.birthDate 
                ? new Date(profile.client?.birthDate || profile.user?.birthDate).toLocaleDateString('ja-JP')
                : '未設定'}
            </Typography>
          </Grid>
          {(profile.client?.birthTime || profile.user?.birthTime) && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">出生時刻</Typography>
              <Typography variant="body1">{profile.client?.birthTime || profile.user?.birthTime}</Typography>
            </Grid>
          )}
          {(profile.client?.birthLocation?.name || profile.user?.birthLocation?.name) && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">出生地</Typography>
              <Typography variant="body1">
                {profile.client?.birthLocation?.name || profile.user?.birthLocation?.name}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* 基本属性 */}
      {profile.elementBalance && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>基本属性</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(profile.elementBalance).map(([element, value]) => {
              if (element === 'mainElement' || element === 'isBalanced') return null;
              const elementName = element === 'wood' ? '木' : 
                                  element === 'fire' ? '火' : 
                                  element === 'earth' ? '土' : 
                                  element === 'metal' ? '金' : 
                                  element === 'water' ? '水' : element;
              const isMain = profile.elementBalance.mainElement === elementName;
              return (
                <Chip
                  key={element}
                  icon={getElementIcon(elementName)}
                  label={`${elementName} ${value}%`}
                  sx={{
                    bgcolor: isMain ? getElementColor(elementName) : 'transparent',
                    color: isMain ? 'white' : getElementColor(elementName),
                    border: `2px solid ${getElementColor(elementName)}`,
                    fontWeight: isMain ? 'bold' : 'normal',
                  }}
                />
              );
            })}
          </Box>
        </Paper>
      )}

      {/* 格局と用神 */}
      {(profile.kakukyoku || profile.yojin) && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>格局・用神</Typography>
          <Grid container spacing={2}>
            {profile.kakukyoku && (
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">格局</Typography>
                <Typography variant="body1">{profile.kakukyoku}</Typography>
              </Grid>
            )}
            {profile.yojin && (
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">用神</Typography>
                <Typography variant="body1">{Array.isArray(profile.yojin) ? profile.yojin.join('、') : profile.yojin}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* 四柱 */}
      {profile.fourPillars && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>四柱</Typography>
          <Grid container spacing={2}>
            {['year', 'month', 'day', 'hour'].map((pillarType) => {
              const pillar = profile.fourPillars[`${pillarType}Pillar`];
              if (!pillar) return null;
              
              const pillarName = pillarType === 'year' ? '年柱' :
                                pillarType === 'month' ? '月柱' :
                                pillarType === 'day' ? '日柱' : '時柱';
              
              return (
                <Grid item xs={3} key={pillarType}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {pillarName}
                    </Typography>
                    <Box sx={{ 
                      border: '2px solid',
                      borderColor: getElementColor(pillar.element || '木'),
                      borderRadius: 1,
                      p: 1,
                      bgcolor: 'background.paper'
                    }}>
                      <Typography variant="h6" sx={{ color: getElementColor(pillar.element || '木') }}>
                        {pillar.heavenlyStem || pillar.stem}
                      </Typography>
                      <Divider sx={{ my: 0.5 }} />
                      <Typography variant="h6">
                        {pillar.earthlyBranch || pillar.branch}
                      </Typography>
                    </Box>
                    {profile.tenGods && profile.tenGods[pillarType] && (
                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {profile.tenGods[pillarType]}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}

      {/* 五行バランス */}
      {profile.elementBalance && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>五行バランス</Typography>
          <Box sx={{ mt: 2 }}>
            {Object.entries(profile.elementBalance).map(([element, value]) => {
              if (element === 'mainElement' || element === 'isBalanced') return null;
              const elementName = element === 'wood' ? '木' : 
                                  element === 'fire' ? '火' : 
                                  element === 'earth' ? '土' : 
                                  element === 'metal' ? '金' : 
                                  element === 'water' ? '水' : element;
              return (
                <Box key={element} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getElementIcon(elementName)}
                      {elementName}
                    </Typography>
                    <Typography variant="body2">{value}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Number(value)} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getElementColor(elementName),
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* 性格特性 */}
      {profile.personality && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>性格特性</Typography>
          
          {profile.personality.traits && profile.personality.traits.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                特徴
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {profile.personality.traits.map((trait: string, index: number) => (
                  <Chip key={index} label={trait} size="small" />
                ))}
              </Box>
            </Box>
          )}
          
          {profile.personality.strengths && profile.personality.strengths.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                強み
              </Typography>
              <Box sx={{ pl: 2 }}>
                {profile.personality.strengths.map((strength: string, index: number) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                    • {strength}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
          
          {profile.personality.weaknesses && profile.personality.weaknesses.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                改善点
              </Typography>
              <Box sx={{ pl: 2 }}>
                {profile.personality.weaknesses.map((weakness: string, index: number) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                    • {weakness}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};