import { Box, Alert } from '@mui/material';

// モック使用時の視覚的インジケーター
export const MockIndicator = () => {
  if (import.meta.env.PROD) {
    // 本番環境では表示しない
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
    >
      <Alert 
        severity="warning" 
        sx={{ 
          borderRadius: 0,
          py: 0.5,
          backgroundColor: '#ff5252',
          color: 'white',
          '& .MuiAlert-icon': {
            color: 'white',
          },
        }}
      >
        ⚠️ モックデータ使用中 - 本番環境では使用不可
      </Alert>
    </Box>
  );
};