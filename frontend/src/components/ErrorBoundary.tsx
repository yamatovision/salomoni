import React from 'react';
import { Alert, Button, Box, Container, Typography } from '@mui/material';
import { logger } from '../utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Component Error Boundary Triggered', error, {
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack || undefined,
      errorBoundary: true
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Box 
            sx={{ 
              mt: 8, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 2 
            }}
          >
            <Alert severity="error" sx={{ width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                アプリケーションエラーが発生しました
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                申し訳ございません。予期しないエラーが発生しました。
              </Typography>
            </Alert>
            <Button 
              variant="contained" 
              onClick={this.handleReload}
              sx={{ mt: 2 }}
            >
              ページを再読み込み
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}