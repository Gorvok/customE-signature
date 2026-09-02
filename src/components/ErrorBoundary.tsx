import { Component, type ErrorInfo, type ReactNode } from 'react';
import { STORAGE_KEYS } from '../data/storage';

interface Props {
  children: ReactNode;
  /** Overridable for tests; defaults to a full page reload. */
  onReload?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defense: a render error anywhere below shows a recovery panel
 * instead of a blank page. "Clear saved data" exists because a bad value in
 * localStorage would otherwise reproduce the crash on every reload.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unrecoverable render error', error, info.componentStack);
  }

  reload = () => {
    (this.props.onReload ?? (() => window.location.reload()))();
  };

  clearAndReload = () => {
    try {
      for (const key of STORAGE_KEYS) localStorage.removeItem(key);
    } catch {
      // Storage unavailable; a reload is still the best we can do.
    }
    this.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="min-h-screen flex items-center justify-center p-6 bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            The page hit an error it could not recover from. Reloading usually fixes it. If it keeps happening, clear the saved signature and start fresh.
          </p>
          <pre className="text-left text-xs rounded-lg bg-gray-100 dark:bg-gray-800 p-3 overflow-auto max-h-32 whitespace-pre-wrap break-words">{this.state.error.message}</pre>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={this.reload}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.clearAndReload}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
            >
              Clear saved data and reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
