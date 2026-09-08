import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// Interception globale précoce (évite écran blanc si erreur JS hors cycle React)
if (window.location.search.includes('reset=1')) {
  try {
    localStorage.clear();
    sessionStorage.clear();
    const cleanUrl = window.location.origin + window.location.pathname;
    window.location.replace(cleanUrl);
  } catch {}
}
window.addEventListener('error', (event) => {
  // eslint-disable-next-line no-console
  console.error('[Global Window Error]', event.error || event.message);
  const rootEl = document.getElementById('root');
  if (rootEl && !rootEl.hasChildNodes()) {
    rootEl.innerHTML = `
      <div style="position:fixed;inset:0;background:#050913;color:#f43f5e;padding:24px;font-family:monospace;z-index:99999;overflow:auto;">
        <h1 style="font-size:18px;font-weight:bold;margin-bottom:12px;">⚠️ Agent OS · Erreur Globale JavaScript</h1>
        <div style="background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.3);border-radius:8px;padding:16px;margin-bottom:16px;color:#fecdd3;">
          <strong>Message:</strong> ${event.message}
        </div>
        <pre style="background:#000;border:1px solid #334155;border-radius:8px;padding:16px;font-size:11px;color:#94a3b8;white-space:pre-wrap;">${event.error?.stack || event.filename + ':' + event.lineno}</pre>
        <button onclick="localStorage.clear();window.location.reload();" style="margin-top:16px;background:#38bdf8;color:#000;font-weight:bold;padding:8px 16px;border-radius:6px;cursor:pointer;border:none;">Purger LocalStorage & Recharger</button>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  // eslint-disable-next-line no-console
  console.error('[Global Unhandled Rejection]', event.reason);
});

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // eslint-disable-next-line no-console
    console.error('[Agent OS Root Error]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#050913',
          color: '#f43f5e',
          padding: '24px',
          fontFamily: 'monospace',
          zIndex: 99999,
          overflow: 'auto',
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            ⚠️ Agent OS · Erreur d'Exécution React Interceptée
          </h1>
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            color: '#fecdd3'
          }}>
            <strong>Message:</strong> {this.state.error?.message}
          </div>
          <pre style={{
            background: '#000000',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '11px',
            color: '#94a3b8',
            whiteSpace: 'pre-wrap'
          }}>
            {this.state.error?.stack}
            {'\n\nComponent Stack:\n'}
            {this.state.errorInfo?.componentStack}
          </pre>
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() => {
                localStorage.removeItem('agent-os.session.v3');
                localStorage.removeItem('agent-os.session.v2');
                window.location.reload();
              }}
              style={{
                backgroundColor: '#38bdf8',
                color: '#000',
                fontWeight: 'bold',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              Réinitialiser la session & Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('root element missing');
createRoot(root).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
