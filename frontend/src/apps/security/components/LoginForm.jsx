import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
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
            disabled={loading}
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a] focus:border-transparent transition"
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
            disabled={loading}
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a] focus:border-transparent transition"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#00687a] hover:bg-[#005564] text-white font-montserrat font-semibold py-3 px-4 rounded-xl text-sm transition shadow-md shadow-[#00687a]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verificando...</span>
          </>
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
