// Centralized error handling utilities
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Handle network errors
  if (!navigator.onLine) {
    return new AppError('Network connection lost. Please check your internet connection.', 'NETWORK_ERROR');
  }

  // Handle fetch errors
  if (error?.message?.includes('fetch')) {
    return new AppError('Unable to connect to server. Please try again.', 'CONNECTION_ERROR');
  }

  // Handle authentication errors
  if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
    localStorage.removeItem('healthcare_token');
    return new AppError('Your session has expired. Please login again.', 'AUTH_ERROR', 401);
  }

  // Handle server errors
  if (error?.message?.includes('500')) {
    return new AppError('Server error. Please try again later.', 'SERVER_ERROR', 500);
  }

  // Default error
  return new AppError(
    error?.message || 'An unexpected error occurred. Please try again.',
    'UNKNOWN_ERROR'
  );
}

export function logError(error: any, context?: string) {
  const errorInfo = {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console.error('Application Error:', errorInfo);
  
  // In production, you might want to send this to an error reporting service
  // sendToErrorReporting(errorInfo);
}