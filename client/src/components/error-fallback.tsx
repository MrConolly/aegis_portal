import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const handleRefresh = () => {
    // Clear any problematic data
    localStorage.removeItem('healthcare_token');
    
    // Attempt to reset if function provided, otherwise reload
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-red-800">Application Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-slate-600">
            The application encountered an unexpected error. This has been logged for investigation.
          </p>
          
          {error && (
            <details className="text-xs text-left bg-gray-100 p-2 rounded">
              <summary className="cursor-pointer font-medium">Technical Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
            </details>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={handleRefresh} 
              className="w-full"
              variant="default"
            >
              Refresh Application
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
              variant="outline"
            >
              Return to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}