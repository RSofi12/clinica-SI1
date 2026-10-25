import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../apps/security/services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clinica_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verificar sesión con el servidor al cargar
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await authService.fetchCurrentUser();
        if (response?.user) {
          setUser(response.user);
          localStorage.setItem('clinica_user', JSON.stringify(response.user));
        } else {
          setUser(null);
          localStorage.removeItem('clinica_user');
          localStorage.removeItem('token');
        }
      } catch (err) {
        // Si no hay sesión o da 401, se limpia
        setUser(null);
        localStorage.removeItem('clinica_user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  const login = async (loginStr, password) => {
    const response = await authService.login(loginStr, password);
    if (response?.user) {
      setUser(response.user);
      localStorage.setItem('clinica_user', JSON.stringify(response.user));
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      return response.user;
    }
    throw new Error('Respuesta de autenticación inválida');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('clinica_user');
      localStorage.removeItem('token');
    }
  };

  const value = {
    user,
    role: user?.tipo_usuario || null,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
