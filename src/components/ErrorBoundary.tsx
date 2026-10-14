"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("ErrorBoundary caught an error:", error);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback(this.reset);
      return (
        <div
          role="alert"
          className="p-6 rounded-lg border border-danger-border bg-danger-soft text-sm text-danger space-y-3"
        >
          <p className="font-medium">Something went wrong rendering this section.</p>
          <button
            type="button"
            onClick={this.reset}
            className="px-3 py-1.5 rounded-md border border-danger-border bg-surface text-danger text-xs font-medium hover:bg-danger-soft transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
