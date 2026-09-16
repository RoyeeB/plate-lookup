/**
 * Catches render-time exceptions so a bad record or a bug in one card shows an
 * explanation and a way out, instead of React unmounting the tree and leaving a
 * blank white page with no back button.
 *
 * Must be a class: there is still no hook equivalent of componentDidCatch.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { t } from '@/i18n';
import { StateView } from './StateView';
import { reportError } from '@/lib/monitoring';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep the component stack — it is what makes such a report actionable.
    reportError(error, { kind: 'render', componentStack: info.componentStack });
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="screen">
        <StateView
          icon="warning"
          iconColor="var(--danger)"
          title={t.states.crashTitle}
          body={t.states.crashBody}
          actions={[
            {
              label: t.states.reload,
              icon: 'refresh',
              // A full reload, not a state reset: whatever produced the error is
              // still in memory, and the app is cheap to boot.
              onClick: () => window.location.reload(),
            },
          ]}
        />
      </div>
    );
  }
}
