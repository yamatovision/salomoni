export interface LogContext {
  component?: string;
  action?: string;
  endpoint?: string;
  userId?: string;
  sessionId?: string;
  additionalInfo?: Record<string, any>;
  // エラーログで使用される追加プロパティ
  componentStack?: string;
  path?: string;
  email?: string;
  status?: number;
  method?: string;
  requestId?: string;
  cardCount?: number;
  stylistCount?: number;
  stylistId?: string;
  errorBoundary?: boolean;
}

export const logger = {
  info: (message: string, context?: LogContext) => {
    console.log({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    });
  },
  
  error: (message: string, error: Error, context?: LogContext) => {
    console.error({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    });
  },
  
  warn: (message: string, context?: LogContext) => {
    console.warn({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      context: {
        ...context,
        url: window.location.href
      }
    });
  }
};