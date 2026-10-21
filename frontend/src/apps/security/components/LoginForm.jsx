import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Lock, User, AlertCircle, Loader2, Clock, ShieldAlert } from 'lucide-react';

export function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockedCountdown, setLockedCountdown] = useState(0);

  // Manejador del temporizador regresivo de bloqueo
  useEffect(() => {
    if (lockedCountdown <= 0) return;

    const timer = setInterval(() => {
      setLockedCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockedCountdown]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockedCountdown > 0) return;

    setError('');

    if (!loginField.trim() || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    try {
      setLoading(true);
      await login(loginField, password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const data = err.data;
      if (err.status === 423 || data?.is_temporarily_locked) {
        const secs = data?.seconds_remaining || 300;
        setLockedCountdown(secs);
        setError(data?.message || `Cuenta temporalmente bloqueada por seguridad.`);
      } else if (data?.attempts_left !== undefined) {
        setError(`Contraseña incorrecta. Intentos restantes antes del bloqueo: ${data.attempts_left}`);
      } else {
        setError(err.message || 'Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Alerta de bloqueo temporal con temporizador regresivo */}
      {lockedCountdown > 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs sm:text-sm rounded-xl flex items-start gap-3 shadow-xs animate-pulse">
          <Clock className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Acceso bloqueado temporalmente
            </p>
            <p className="text-amber-700 text-xs">
              Se superó el límite de intentos fallidos. Espere que finalice el temporizador de seguridad:
            </p>
            <div className="pt-1 font-mono font-bold text-base text-amber-950">
              ⏳ Desbloqueo en: {formatCountdown(lockedCountdown)}
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Error Convencional */}
      {error && lockedCountdown === 0 && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Usuario o Correo
        </label>
        <div className="relative">
          <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={loginField}
            onChange={(e) => setLoginField(e.target.value)}
            placeholder="admin o usuario@clinica.com"
            disabled={loading || lockedCountdown > 0}
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a] focus:border-transparent transition disabled:bg-slate-100 disabled:cursor-not-allowed"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading || lockedCountdown > 0}
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a] focus:border-transparent transition disabled:bg-slate-100 disabled:cursor-not-allowed"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || lockedCountdown > 0}
        className="w-full bg-[#00687a] hover:bg-[#005564] text-white font-montserrat font-semibold py-3 px-4 rounded-xl text-sm transition shadow-md shadow-[#00687a]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verificando...</span>
          </>
        ) : lockedCountdown > 0 ? (
          <span>Bloqueado temporalmente ({formatCountdown(lockedCountdown)})</span>
        ) : (
          <span>Iniciar Sesión</span>
        )}
      </button>

      <div className="text-center pt-2">
        <p className="text-xs text-slate-400">
          Credenciales de prueba: <span className="font-semibold text-slate-600">admin / admin123</span>
        </p>
      </div>
    </form>
  );
}
