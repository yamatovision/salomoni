import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Switch,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
  Tooltip,
  Stack,
  FormControlLabel,
  Radio,
  RadioGroup,
  Pagination,
} from '@mui/material';
import {
  CloudUpload,
  History,
  Link,
  CheckCircle,
  Error,
  Warning,
  Upload,
  CalendarToday,
  EventNote,
  ArrowForward,
  Help,
  Visibility,
  Save,
  NavigateBefore,
  NavigateNext,
  Description,
  Sync,
  LinkOff,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type {
  ImportHistory,
  ImportSettings,
  FieldMapping,
  CalendarSyncStatus,
} from '../../types';
import { ImportMethod } from '../../types';
import {
  getImportHistory,
  getImportSettings,
  // updateImportSettings,
  getFieldMappings,
  // updateFieldMappings,
  getCalendarSyncStatus,
  connectCalendar,
  uploadCSVFile,
  executeImport,
  // syncCalendar,
} from '../../services/mock/handlers/import';
import type { CSVPreviewData, FileUploadInfo } from '../../services/mock/data/mockImportData';

// タブの値の型定義
type TabValue = 'import' | 'connect' | 'history';

// インポートステップの定義
enum ImportStep {
  SOURCE_SELECTION = 0,
  FIELD_MAPPING = 1,
  DATA_PREVIEW = 2,
  IMPORT_EXECUTION = 3,
}

const DataImportPage: React.FC = () => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 状態管理
  const [activeTab, setActiveTab] = useState<TabValue>('import');
  const [currentStep, setCurrentStep] = useState<ImportStep>(ImportStep.SOURCE_SELECTION);
  const [loading, setLoading] = useState(false);
  const [importHistories, setImportHistories] = useState<ImportHistory[]>([]);
  const [importSettings, setImportSettings] = useState<ImportSettings | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [calendarStatuses, setCalendarStatuses] = useState<CalendarSyncStatus[]>([]);
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileUploadInfo | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreviewData | null>(null);
  const [importOption, setImportOption] = useState('update_and_create');
  const [historyPage, setHistoryPage] = useState(1);
  const [syncInterval, setSyncInterval] = useState('15min');
  const [importProgress, setImportProgress] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // 初期データの読み込み
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [histories, settings, mappings, statuses] = await Promise.all([
        getImportHistory(),
        getImportSettings(),
        getFieldMappings(),
        getCalendarSyncStatus(),
      ]);

      if (histories.success && histories.data) {
        setImportHistories(histories.data);
      }
      if (settings.success && settings.data) {
        setImportSettings(settings.data);
      }
      if (mappings.success && mappings.data) {
        setFieldMappings(mappings.data);
      }
      if (statuses.success && statuses.data) {
        setCalendarStatuses(statuses.data);
      }
    } catch (error) {
      console.error('Failed to load import data:', error);
    } finally {
      setLoading(false);
    }
  };

  // タブ変更ハンドラー
  // const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
  //   setActiveTab(newValue);
  //   if (newValue === 'import') {
  //     setCurrentStep(ImportStep.SOURCE_SELECTION);
  //   }
  // };

  // ステップ進行ハンドラー
  const handleNextStep = () => {
    if (currentStep < ImportStep.IMPORT_EXECUTION) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > ImportStep.SOURCE_SELECTION) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ファイル選択ハンドラー
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // setSelectedFile(file);
      setLoading(true);
      try {
        const response = await uploadCSVFile(file);
        if (response.success && response.data) {
          setFileInfo(response.data.fileInfo);
          setCsvPreview(response.data.preview);
          handleNextStep();
        }
      } catch (error) {
        console.error('Failed to upload file:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // フィールドマッピング更新ハンドラー
  const handleFieldMappingToggle = (index: number) => {
    const updatedMappings = [...fieldMappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      isEnabled: !updatedMappings[index].isEnabled,
    };
    setFieldMappings(updatedMappings);
  };

  // インポート実行ハンドラー
  const handleExecuteImport = async () => {
    if (!importSettings) return;

    setLoading(true);
    setImportProgress(0);
    
    // プログレスバーのシミュレーション
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await executeImport('csv', importSettings);
      if (response.success) {
        clearInterval(progressInterval);
        setImportProgress(100);
        setShowSuccessDialog(true);
        
        // 履歴を再読み込み
        const histories = await getImportHistory();
        if (histories.success && histories.data) {
          setImportHistories(histories.data);
        }
      }
    } catch (error) {
      console.error('Failed to execute import:', error);
      clearInterval(progressInterval);
    } finally {
      setLoading(false);
    }
  };

  // カレンダー接続ハンドラー
  const handleConnectCalendar = async (provider: 'google' | 'icloud' | 'outlook') => {
    setLoading(true);
    try {
      const response = await connectCalendar(provider);
      if (response.success) {
        // カレンダー状態を再読み込み
        const statuses = await getCalendarSyncStatus();
        if (statuses.success && statuses.data) {
          setCalendarStatuses(statuses.data);
        }
      }
    } catch (error) {
      console.error('Failed to connect calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  // インポート成功ダイアログを閉じる
  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    setActiveTab('history');
    setCurrentStep(ImportStep.SOURCE_SELECTION);
    setImportProgress(0);
  };

  // ステップ名の取得
  const getStepLabel = (step: ImportStep): string => {
    switch (step) {
      case ImportStep.SOURCE_SELECTION:
        return 'データソース選択';
      case ImportStep.FIELD_MAPPING:
        return 'フィールドマッピング';
      case ImportStep.DATA_PREVIEW:
        return 'データプレビュー';
      case ImportStep.IMPORT_EXECUTION:
        return 'インポート実行';
      default:
        return '';
    }
  };

  // データ品質インジケーターの色を取得
  const getQualityColor = (priority: string) => {
    switch (priority) {
      case 'standard':
        return theme.palette.success.main;
      case 'recommended':
        return theme.palette.warning.main;
      case 'optional':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // インポートステータスのバッジを取得
  const getStatusBadge = (history: ImportHistory) => {
    if (history.failureCount === 0) {
      return <Chip icon={<CheckCircle />} label="成功" color="success" size="small" />;
    } else if (history.successCount === 0) {
      return <Chip icon={<Error />} label="エラー" color="error" size="small" />;
    } else {
      return <Chip icon={<Warning />} label="一部成功" color="warning" size="small" />;
    }
  };

  // レンダリング
  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          データインポート
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {activeTab === 'import' && currentStep === ImportStep.SOURCE_SELECTION && (
            <>
              <Button
                variant="outlined"
                startIcon={<History />}
                onClick={() => setActiveTab('history')}
              >
                インポート履歴
              </Button>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
              >
                新規インポート
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* タブコンテンツ */}
      <Box sx={{ display: activeTab === 'import' ? 'block' : 'none' }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CloudUpload sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h6">
                クライアントデータのインポート
              </Typography>
            </Box>

            {/* ステッパー */}
            <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
              {[0, 1, 2, 3].map((step) => (
                <Step key={step} completed={currentStep > step}>
                  <StepLabel>{getStepLabel(step)}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* ステップコンテンツ */}
            {currentStep === ImportStep.SOURCE_SELECTION && (
              <Box>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  インポート方法を選択してください
                </Typography>
                
                {/* CSVアップロード */}
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    border: '2px dashed',
                    borderColor: theme.palette.divider,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: theme.palette.primary.main + '08',
                    },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    CSVファイルのアップロード
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    CSVファイルからクライアント情報をインポートします。
                  </Typography>
                  <Button
                    variant="text"
                    color="primary"
                    sx={{ mt: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // テンプレートダウンロード処理
                    }}
                  >
                    テンプレートをダウンロード
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                </Paper>

                <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 3 }}>
                  または
                </Typography>

                {/* カレンダー連携 */}
                <Paper
                  sx={{
                    p: 3,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                  onClick={() => setActiveTab('connect')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        backgroundColor: theme.palette.primary.main + '1A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <CalendarToday sx={{ color: theme.palette.primary.main }} />
                    </Box>
                    <Typography variant="h6">カレンダー連携</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    GoogleカレンダーやiCloudカレンダーと連携して、予約情報を自動的に同期します。
                  </Typography>
                  <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                    <Link sx={{ mr: 1 }} />
                    カレンダー設定へ
                  </Button>
                </Paper>
              </Box>
            )}

            {currentStep === ImportStep.FIELD_MAPPING && fileInfo && (
              <Box>
                {/* ファイル情報 */}
                <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.grey[50] }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Description sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {fileInfo.fileName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {fileInfo.fileSize}・{fileInfo.recordCount}件のレコード・最終更新: {fileInfo.lastModified.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* フィールドマッピング */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    CSVデータのマッピング
                  </Typography>
                  <Tooltip title="必要なフィールドのみをONにしてインポートします。データがない場合はOFFのままでOKです。">
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <Help fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Stack spacing={2}>
                  {fieldMappings.map((mapping, index) => (
                    <Paper key={index} sx={{ p: 2, boxShadow: 1 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: getQualityColor(mapping.priority),
                                mr: 1,
                              }}
                            />
                            <Typography fontWeight="medium">{mapping.sourceField}</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 1 }} sx={{ textAlign: 'center' }}>
                          <ArrowForward color="action" />
                        </Grid>
                        <Grid size={{ xs: 5 }}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium" gutterBottom>
                              CSV内フィールド名：
                            </Typography>
                            <Select
                              size="small"
                              fullWidth
                              value={mapping.targetField}
                              onChange={(e) => {
                                const updatedMappings = [...fieldMappings];
                                updatedMappings[index] = {
                                  ...updatedMappings[index],
                                  targetField: e.target.value,
                                };
                                setFieldMappings(updatedMappings);
                              }}
                            >
                              <MenuItem value={mapping.targetField}>{mapping.targetField}</MenuItem>
                            </Select>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 3 }} sx={{ textAlign: 'right' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Switch
                              checked={mapping.isEnabled}
                              onChange={() => handleFieldMappingToggle(index)}
                            />
                            <Chip
                              label={
                                mapping.priority === 'standard'
                                  ? '標準'
                                  : mapping.priority === 'recommended'
                                  ? '推奨'
                                  : '任意'
                              }
                              size="small"
                              color={
                                mapping.priority === 'standard'
                                  ? 'primary'
                                  : mapping.priority === 'recommended'
                                  ? 'warning'
                                  : 'default'
                              }
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>

                {/* 占い・診断説明 */}
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    インポートされたクライアントデータから、Salomoniの占い・パーソナリティ診断機能を自動実行します。
                    必要な最低限の情報は「性別」です。生年月日があれば詳細な運勢診断が、生まれ時間があればより精密な性格分析が可能になります。
                    データがない場合でもクライアント情報として登録可能です。
                  </Typography>
                </Alert>

                {/* アクションボタン */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    variant="outlined"
                    startIcon={<NavigateBefore />}
                    onClick={handlePreviousStep}
                  >
                    前のステップ
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<NavigateNext />}
                    onClick={handleNextStep}
                  >
                    データプレビュー
                  </Button>
                </Box>
              </Box>
            )}

            {currentStep === ImportStep.DATA_PREVIEW && csvPreview && fileInfo && (
              <Box>
                {/* ファイル情報 */}
                <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.grey[50] }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Description sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {fileInfo.fileName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {fileInfo.fileSize}・{fileInfo.recordCount}件のレコード
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      icon={<CheckCircle />}
                      label="データ検証成功"
                      color="success"
                    />
                  </Box>
                </Paper>

                {/* データプレビュー */}
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  データプレビュー（最初の5件）
                </Typography>
                
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {csvPreview.headers.map((header, index) => (
                          <TableCell key={index}>{header}</TableCell>
                        ))}
                        <TableCell>占い結果</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {csvPreview.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex}>{cell}</TableCell>
                          ))}
                          <TableCell>
                            <Chip
                              label={['幸運', '安定', '成長', '創造', '調和'][rowIndex % 5]}
                              size="small"
                              sx={{
                                backgroundColor: theme.palette.primary.main + '33',
                                color: theme.palette.primary.dark,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* データ概要 */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 3 }}>
                    <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        合計レコード数
                      </Typography>
                      <Typography variant="h5" fontWeight="medium">
                        {csvPreview.totalRows}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        新規クライアント
                      </Typography>
                      <Typography variant="h5" fontWeight="medium" color="success.main">
                        32
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        更新クライアント
                      </Typography>
                      <Typography variant="h5" fontWeight="medium" color="primary">
                        6
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        データエラー
                      </Typography>
                      <Typography variant="h5" fontWeight="medium" color="error.main">
                        0
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* インポート設定 */}
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    インポート設定
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={importOption}
                      onChange={(e) => setImportOption(e.target.value)}
                    >
                      <FormControlLabel
                        value="update_and_create"
                        control={<Radio />}
                        label="新規データの追加と既存データの更新を行う（推奨）"
                      />
                      <FormControlLabel
                        value="create_only"
                        control={<Radio />}
                        label="新規データの追加のみを行う（既存データは更新しない）"
                      />
                      <FormControlLabel
                        value="update_only"
                        control={<Radio />}
                        label="既存データの更新のみを行う（新規データは追加しない）"
                      />
                    </RadioGroup>
                  </FormControl>
                </Alert>

                {/* アクションボタン */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    variant="outlined"
                    startIcon={<NavigateBefore />}
                    onClick={handlePreviousStep}
                  >
                    前のステップ
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={handleExecuteImport}
                    disabled={loading}
                  >
                    インポート実行
                  </Button>
                </Box>
              </Box>
            )}

            {currentStep === ImportStep.IMPORT_EXECUTION && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  インポート処理中...
                </Typography>
                <Box sx={{ width: '60%', mx: 'auto', mt: 3, mb: 2 }}>
                  <LinearProgress variant="determinate" value={importProgress} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {importProgress}% 完了
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* カレンダー連携タブ */}
      <Box sx={{ display: activeTab === 'connect' ? 'block' : 'none' }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Link sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h6">
                カレンダー連携設定
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {calendarStatuses.map((status) => (
                <Grid size={{ xs: 12, md: 6 }} key={status.provider}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            backgroundColor: theme.palette.primary.main + '1A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                          }}
                        >
                          {status.provider === 'google' ? (
                            <CalendarToday sx={{ color: theme.palette.primary.main }} />
                          ) : (
                            <EventNote sx={{ color: theme.palette.primary.main }} />
                          )}
                        </Box>
                        <Typography variant="h6">
                          {status.provider === 'google' ? 'Googleカレンダー' : 'iCloudカレンダー'}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        {status.provider === 'google'
                          ? 'Googleカレンダーからクライアントの予約情報をSalomoniに同期します。ホットペッパーなど外部予約システムもカレンダーに連携すれば一元管理できます。'
                          : 'Apple製品でご利用のiCloudカレンダーと予約情報を同期します。'}
                      </Typography>

                      <Stack spacing={1} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main, mr: 1 }} />
                          <Typography variant="body2">
                            {status.provider === 'google'
                              ? '予約情報の取得（日時、クライアント名）'
                              : 'iCloudカレンダーからの予約情報取得'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main, mr: 1 }} />
                          <Typography variant="body2">複数カレンダーの同時連携</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main, mr: 1 }} />
                          <Typography variant="body2">
                            {status.provider === 'google'
                              ? '予約変更の自動反映'
                              : 'カレンダーイベントの詳細情報取得'}
                          </Typography>
                        </Box>
                      </Stack>

                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={status.status === 'connected' ? <Sync /> : <Link />}
                        onClick={() => handleConnectCalendar(status.provider)}
                        disabled={loading}
                      >
                        {status.status === 'connected' ? '再連携する' : '連携する'}
                      </Button>

                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <Chip
                          icon={status.status === 'connected' ? <Link /> : <LinkOff />}
                          label={status.status === 'connected' ? '連携済み' : '未連携'}
                          size="small"
                          color={status.status === 'connected' ? 'success' : 'default'}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* カレンダー連携の説明 */}
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                カレンダー連携の特徴
              </Typography>
              <Typography variant="body2" paragraph>
                カレンダー連携を利用すると、以下のようなメリットがあります：
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>ホットペッパーなど外部予約システムからGoogleカレンダーに連携済みなら、追加設定不要</li>
                <li>サロンで独自に管理している予約もカレンダーに入力するだけで連携可能</li>
                <li>複数の予約チャネルを一元管理できる</li>
                <li>予約の変更・キャンセルが自動反映される</li>
              </ul>
            </Alert>

            {/* 自動同期頻度設定 */}
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                自動同期頻度の設定
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(e.target.value)}
                  >
                    <MenuItem value="5min">5分ごと</MenuItem>
                    <MenuItem value="15min">15分ごと</MenuItem>
                    <MenuItem value="30min">30分ごと</MenuItem>
                    <MenuItem value="1hour">1時間ごと</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined" startIcon={<Save />}>
                  設定を保存
                </Button>
              </Box>
            </Paper>

            {/* 外部予約システム接続方法 */}
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                Google/Appleカレンダーに外部予約システムを接続する方法
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>ホットペッパービューティー</strong>の予約情報をGoogleカレンダーに連携するには：
              </Typography>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li>ホットペッパービューティー管理画面にログイン</li>
                <li>「各種設定」→「カレンダー連携」を選択</li>
                <li>「Googleカレンダー連携」をONにする</li>
                <li>画面の指示に従ってGoogleアカウントを連携</li>
              </ol>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <Button variant="text" color="primary" size="small">
                  詳しい設定方法を見る
                </Button>
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>

      {/* インポート履歴タブ */}
      <Box sx={{ display: activeTab === 'history' ? 'block' : 'none' }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <History sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h6">
                インポート履歴
              </Typography>
            </Box>

            {/* フィルター */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <FormLabel>データソース</FormLabel>
                  <Select defaultValue="all">
                    <MenuItem value="all">すべて</MenuItem>
                    <MenuItem value="csv">CSVインポート</MenuItem>
                    <MenuItem value="google">Googleカレンダー</MenuItem>
                    <MenuItem value="icloud">iCloudカレンダー</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <FormLabel>状態</FormLabel>
                  <Select defaultValue="all">
                    <MenuItem value="all">すべて</MenuItem>
                    <MenuItem value="success">成功</MenuItem>
                    <MenuItem value="partial">一部成功</MenuItem>
                    <MenuItem value="error">エラー</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <FormLabel>期間</FormLabel>
                  <Select defaultValue="all">
                    <MenuItem value="all">すべて</MenuItem>
                    <MenuItem value="today">今日</MenuItem>
                    <MenuItem value="week">過去7日間</MenuItem>
                    <MenuItem value="month">過去30日間</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* 履歴テーブル */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>日時</TableCell>
                    <TableCell>インポート元</TableCell>
                    <TableCell align="right">登録件数</TableCell>
                    <TableCell align="right">更新件数</TableCell>
                    <TableCell>状態</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importHistories.slice((historyPage - 1) * 5, historyPage * 5).map((history) => (
                    <TableRow key={history.id}>
                      <TableCell>{new Date(history.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {history.method === ImportMethod.CSV
                          ? 'CSVインポート'
                          : history.method === ImportMethod.GOOGLE_CALENDAR
                          ? 'Googleカレンダー同期'
                          : 'iCloudカレンダー同期'}
                      </TableCell>
                      <TableCell align="right">{history.successCount}</TableCell>
                      <TableCell align="right">{history.totalRecords - history.successCount}</TableCell>
                      <TableCell>{getStatusBadge(history)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                        >
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* ページネーション */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(importHistories.length / 5)}
                page={historyPage}
                onChange={(_event, value) => setHistoryPage(value)}
                color="primary"
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* インポート成功ダイアログ */}
      <Dialog open={showSuccessDialog} onClose={handleCloseSuccessDialog}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ color: theme.palette.success.main, mr: 1 }} />
            インポートが完了しました
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            インポートが正常に完了しました。38件のデータが処理されました。
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              • 新規登録: 32件
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 更新: 6件
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • エラー: 0件
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleCloseSuccessDialog}>
            履歴を確認
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataImportPage;