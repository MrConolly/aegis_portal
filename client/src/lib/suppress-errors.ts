// Comprehensive error suppression to prevent cryptic error codes
export function initializeErrorSuppression() {
  // Override console.error to filter out Replit runtime error overlay messages
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    // Suppress specific error patterns that cause cryptic codes
    if (
      message.includes('runtime-error-modal') ||
      message.includes('error-overlay') ||
      message.includes('vite-plugin-runtime-error-modal') ||
      message.includes('chunk-') ||
      message.includes('__vite')
    ) {
      return; // Silently ignore these errors
    }
    
    // Only log meaningful errors
    originalConsoleError.apply(console, args);
  };

  // Enhanced unhandled rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    
    // Clear auth tokens for auth-related errors
    if (reason?.message?.includes('401') || 
        reason?.message?.includes('Unauthorized') ||
        reason?.message?.includes('Invalid token')) {
      localStorage.removeItem('healthcare_token');
    }
    
    // Always prevent the error from bubbling up
    event.preventDefault();
  });

  // Enhanced error handler
  window.addEventListener('error', (event) => {
    // Clear auth tokens for auth-related errors
    if (event.message?.includes('401') || 
        event.message?.includes('Unauthorized') ||
        event.message?.includes('Invalid token')) {
      localStorage.removeItem('healthcare_token');
    }
    
    // Prevent error display
    event.preventDefault();
  });
}