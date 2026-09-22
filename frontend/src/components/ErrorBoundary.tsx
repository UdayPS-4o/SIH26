import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[EKADHARA] ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-base, #0a0e14)',
          color: 'var(--text-primary, #e8ecf1)',
          fontFamily: '"JetBrains Mono","Fira Code",monospace',
          padding: 40,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: '2px solid var(--color-danger, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            boxShadow: '0 0 24px var(--sev-critical-border)',
          }}>
            <span style={{ fontSize: 28, color: '#ef4444' }}>✕</span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12, color: '#ef4444' }}>
            SYSTEM FAILURE
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary, #8b95a5)', maxWidth: 480, textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
            A critical error occurred in the EKADHARA monitoring pipeline.
            The enclave remains operational — this is a display-layer fault only.
          </p>
          <pre style={{
            background: 'var(--bg-inset, #0a0e14)',
            border: '1px solid var(--border-default, #1e2736)',
            borderRadius: 4,
            padding: 16,
            fontSize: 11,
            color: 'var(--text-dim, #4f5b6b)',
            maxWidth: 600,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 24,
              padding: '8px 24px',
              background: 'transparent',
              border: '1px solid var(--color-danger, #ef4444)',
              color: '#ef4444',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            RETRY CONNECTION
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
