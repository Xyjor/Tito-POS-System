import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../ui/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled application error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
          <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-600">{this.state.error.message}</p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
