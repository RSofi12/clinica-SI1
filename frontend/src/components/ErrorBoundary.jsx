import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('clinica_user');
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800/90 border border-rose-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Error de Ejecución</h2>
                <p className="text-xs text-rose-300">Se detectó una excepción en la interfaz</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-700 font-mono break-words">
              {this.state.error?.message || 'Error desconocido en tiempo de ejecución.'}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-3 bg-[#00687a] hover:bg-[#005564] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Limpiar e Inicio</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
