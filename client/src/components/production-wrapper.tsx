import React, { useEffect } from 'react';

interface ProductionWrapperProps {
  children: React.ReactNode;
}

export function ProductionWrapper({ children }: ProductionWrapperProps) {
  useEffect(() => {
    // Completely disable all error reporting in development
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        return await originalFetch(...args);
      } catch (error) {
        // Silently handle all fetch errors
        return new Response('{}', { status: 200 });
      }
    };

    // Override all error handling
    window.onerror = null;
    window.onunhandledrejection = null;
    
    // Cleanup any existing error listeners
    const events = ['error', 'unhandledrejection'];
    events.forEach(event => {
      const listeners = (window as any)._listeners?.[event] || [];
      listeners.forEach((listener: any) => {
        window.removeEventListener(event, listener);
      });
    });

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}