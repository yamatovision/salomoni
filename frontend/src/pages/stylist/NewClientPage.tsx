import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Collapse,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Calculate,
  ExpandMore,
  ExpandLess,
  Star,
  Spa,
  Psychology,
  Check,
} from '@mui/icons-material';
import { FiveElements } from '../../types';
import type { ClientCreateRequest } from '../../types';
import { clientService } from '../../services';
import {
  generateMockFourPillarsData,
  generateMockElementBalance,
  generateMockCompatibility,
  generateBeautyAdvice,
} from '../../services/mock/data/mockFourPillarsData';

const steps = ['基本情報入力', '四柱推命計算', '結果確認'];

export const NewClientPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // フォームデータ
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    gender: '',
  });
  
  // 計算結果
  const [results, setResults] = useState<{
    fourPillars: any;
    elementBalance: any;
    compatibility: any;
    beautyAdvice: string[];
  } | null>(null);

  const handleNext = () => {
    if (activeStep === 0) {
      // 入力検証
      if (!formData.name || !formData.birthDate || !formData.gender) {
        return;
      }
      setActiveStep(1);
      calculateFourPillars();
    } else if (activeStep === 1) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const calculateFourPillars = async () => {
    setIsCalculating(true);
    
    // シミュレーション用の遅延
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const fourPillars = generateMockFourPillarsData(new Date(formData.birthDate));
    const elementBalance = generateMockElementBalance(fourPillars);
    const compatibility = generateMockCompatibility(
      `client-${Date.now()}`,
      'mock-user-001' // 現在のスタイリストID
    );
    const beautyAdvice = generateBeautyAdvice(elementBalance);
    
    setResults({
      fourPillars,
      elementBalance,
      compatibility,
      beautyAdvice,
    });
    
    setIsCalculating(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getElementColor = (element: FiveElements): string => {
    const colorMap = {
      [FiveElements.WOOD]: '#4ade80',
      [FiveElements.FIRE]: '#f87171',
      [FiveElements.EARTH]: '#fbbf24',
      [FiveElements.METAL]: '#e5e7eb',
      [FiveElements.WATER]: '#60a5fa',
    };
    return colorMap[element];
  };

  const getElementIcon = (element: FiveElements): string => {
    const iconMap = {
      [FiveElements.WOOD]: '🌳',
      [FiveElements.FIRE]: '🔥',
      [FiveElements.EARTH]: '🏔️',
      [FiveElements.METAL]: '⚔️',
      [FiveElements.WATER]: '💧',
    };
    return iconMap[element];
  };

  const getElementName = (element: FiveElements): string => {
    const nameMap = {
      [FiveElements.WOOD]: '木',
      [FiveElements.FIRE]: '火',
      [FiveElements.EARTH]: '土',
      [FiveElements.METAL]: '金',
      [FiveElements.WATER]: '水',
    };
    return nameMap[element];
  };

  const renderStep0 = () => (
    <Box sx={{ mt: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
          クライアント基本情報
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="お名前"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 3 }}
            required
          />
          
          <TextField
            fullWidth
            label="生年月日"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 3 }}
            required
          />
          
          <TextField
            fullWidth
            label="出生時刻（わかる場合）"
            type="time"
            value={formData.birthTime}
            onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 3 }}
            helperText="不明の場合は空欄でも構いません"
          />
          
          <FormControl component="fieldset" required>
            <FormLabel component="legend">性別</FormLabel>
            <RadioGroup
              row
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <FormControlLabel value="female" control={<Radio />} label="女性" />
              <FormControlLabel value="male" control={<Radio />} label="男性" />
              <FormControlLabel value="other" control={<Radio />} label="その他" />
            </RadioGroup>
          </FormControl>
        </Box>
      </Paper>
    </Box>
  );

  const renderStep1 = () => (
    <Box sx={{ mt: 3 }}>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          <Calculate sx={{ mr: 1, verticalAlign: 'middle' }} />
          四柱推命計算中
        </Typography>
        
        {isCalculating ? (
          <Box sx={{ mt: 4, mb: 4 }}>
            <LinearProgress color="primary" sx={{ mb: 3 }} />
            <Typography variant="body2" color="text.secondary">
              生年月日から命式を計算しています...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h3" sx={{ color: 'success.main', mb: 2 }}>
              ✓
            </Typography>
            <Typography variant="body1">
              計算が完了しました
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );

  const renderStep2 = () => {
    if (!results) return null;

    return (
      <Box sx={{ mt: 3 }}>
        {/* 相性診断結果 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Star sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">スタイリストとの相性</Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h2" sx={{ color: 'primary.main' }}>
                {results.compatibility.totalScore}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                / 100
              </Typography>
            </Box>
            
            <Chip
              label={
                results.compatibility.relationshipType === 'excellent' ? '相性◎' :
                results.compatibility.relationshipType === 'good' ? '相性○' :
                '相性△'
              }
              color={
                results.compatibility.relationshipType === 'excellent' ? 'success' :
                results.compatibility.relationshipType === 'good' ? 'primary' :
                'default'
              }
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              {results.compatibility.advice}
            </Typography>
          </CardContent>
        </Card>

        {/* 五行バランス */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => toggleSection('elements')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Spa sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">五行バランス</Typography>
              </Box>
              <IconButton size="small">
                {expandedSections.elements ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.elements}>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  {Object.entries({
                    wood: results.elementBalance.wood,
                    fire: results.elementBalance.fire,
                    earth: results.elementBalance.earth,
                    metal: results.elementBalance.metal,
                    water: results.elementBalance.water,
                  }).map(([element, percentage]) => {
                    const elementType = element.toUpperCase() as FiveElements;
                    return (
                      <Grid size={{ xs: 12 }} key={element}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography sx={{ mr: 1 }}>
                            {getElementIcon(elementType)}
                          </Typography>
                          <Typography variant="body2" sx={{ minWidth: 30 }}>
                            {getElementName(elementType)}
                          </Typography>
                          <Box sx={{ flex: 1, mx: 2 }}>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getElementColor(elementType),
                                },
                              }}
                            />
                          </Box>
                          <Typography variant="body2">
                            {Math.round(percentage)}%
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
                
                <Alert 
                  severity={results.elementBalance.isBalanced ? 'success' : 'info'}
                  sx={{ mt: 2 }}
                >
                  {results.elementBalance.isBalanced 
                    ? 'バランスの取れた命式です'
                    : `${getElementName(results.elementBalance.mainElement)}の要素が強い命式です`
                  }
                </Alert>
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        {/* 美容アドバイス */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => toggleSection('advice')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Psychology sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">美容アドバイス</Typography>
              </Box>
              <IconButton size="small">
                {expandedSections.advice ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.advice}>
              <List sx={{ mt: 1 }}>
                {results.beautyAdvice.map((advice, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText 
                      primary={advice}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </CardContent>
        </Card>

        {/* アクションボタン */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSaveClient}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : <Check />}
          >
            {isSaving ? '保存中...' : '保存してチャットへ'}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleNewClient}
          >
            新規入力
          </Button>
        </Box>
      </Box>
    );
  };

  const handleSaveClient = async () => {
    if (!results) return;
    
    setIsSaving(true);
    try {
      const clientData: ClientCreateRequest = {
        name: formData.name,
        birthDate: formData.birthDate,
        gender: formData.gender as 'male' | 'female' | 'other',
        memo: `五行バランス: ${getElementName(results.elementBalance.mainElement)}が強い\n相性スコア: ${results.compatibility.totalScore}/100`,
      };
      
      const newClient = await clientService.createClient(clientData);
      
      if (newClient && newClient.id) {
        setShowSuccessMessage(true);
        
        // 2秒後にチャットページへ遷移
        setTimeout(() => {
          navigate('/stylist/chat', { 
            state: { 
              clientId: newClient.id,
              clientName: newClient.name 
            } 
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to save client:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleNewClient = () => {
    setActiveStep(0);
    setResults(null);
    setFormData({
      name: '',
      birthDate: '',
      birthTime: '',
      gender: '',
    });
  };

  return (
    <>
      <Container maxWidth="sm" sx={{ pb: 8 }}>
        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && renderStep0()}
        {activeStep === 1 && renderStep1()}
        {activeStep === 2 && renderStep2()}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0 || (activeStep === 1 && isCalculating)}
            onClick={handleBack}
          >
            戻る
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && (!formData.name || !formData.birthDate || !formData.gender)) ||
              (activeStep === 1 && isCalculating) ||
              activeStep === 2
            }
          >
            {activeStep === steps.length - 1 ? '完了' : '次へ'}
          </Button>
        </Box>
      </Container>
      
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          クライアント情報を保存しました。チャットページへ移動します...
        </Alert>
      </Snackbar>
    </>
  );
};