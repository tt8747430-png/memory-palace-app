'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import posthog from 'posthog-js';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/ui';

interface Props {
  children: ReactNode;

  fallback?: (reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    posthog.captureException(error, { extra: { componentStack: info.componentStack } });
    console.error('[CanvasErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback(this.reset);

      return (
        <div
          role="alert"
          className="flex min-h-96 flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8"
        >
          <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden />
          <div className="text-center">
            <p className="font-semibold text-destructive">Canvas failed to render</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.reset} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
