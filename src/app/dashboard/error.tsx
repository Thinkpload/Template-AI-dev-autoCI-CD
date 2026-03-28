'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Dashboard-scoped error boundary — renders inside DashboardLayout.
// "Try again" resets only the dashboard subtree, not the full page.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full text-center" role="alert" aria-live="assertive">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {process.env.NODE_ENV === 'development'
              ? error.message
              : 'An unexpected error occurred.'}
          </p>
          {error.digest && <p className="text-xs mt-2 opacity-50">Error ID: {error.digest}</p>}
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={reset} className="min-h-11">
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
