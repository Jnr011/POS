import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function getTechnicalInfo(error: Error): string {
  const lines = [`${error.name}: ${error.message}`];
  if (error.stack) {
    const trace = error.stack
      .split('\n')
      .slice(1, 6)
      .map(l => l.trim())
      .join('\n');
    lines.push(trace);
  }
  return lines.join('\n\n');
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.name, error.message);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);

    if (import.meta.env.PROD) {
      try {
        fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.message,
            stack: error.stack,
            componentStack: info.componentStack,
            url: window.location.href,
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      } catch {}
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-6">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="size-6 text-destructive" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Something went wrong</h2>
                <p className="text-sm text-muted-foreground">
                  The application encountered an unexpected error. Please try reloading the page.
                </p>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details className="text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
                    Technical details
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-muted text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap font-mono">
                    {getTechnicalInfo(this.state.error)}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={this.handleReset} className="gap-1.5">
                  <RefreshCw className="size-3.5" />
                  Try again
                </Button>
                <Button onClick={this.handleReload} className="gap-1.5">
                  <RefreshCw className="size-3.5" />
                  Reload page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
