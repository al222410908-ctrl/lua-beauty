import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import AdminDashboard from './components/AdminDashboard';
import Alert from './components/Alert';
import { KeyRound, ShieldAlert } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('lua_token') || '');
  const [notification, setNotification] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [products, setProducts] = useState([]);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // Listen for auth-expired events from catalog (cross-tab)
  useEffect(() => {
    const handler = () => {
      setToken('');
      setCurrentUser(null);
      localStorage.removeItem('lua_token');
    };
    window.addEventListener('auth-expired', handler);
    return () => window.removeEventListener('auth-expired', handler);
  }, []);

  // Fetch current user if token exists
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Token expirado');
          return res.json();
        })
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          setToken('');
          setCurrentUser(null);
          localStorage.removeItem('lua_token');
          showToast('Sesión vencida. Por favor, inicia sesión de nuevo.', 'warning');
        });
    } else {
      setCurrentUser(null);
    }
  }, [token, showToast]);

  // Fetch products
  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products?incluir_inactivos=true');
      if (!res.ok) throw new Error('Error al cargar catálogo');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.warn('Error al cargar catálogo, usando mockups.');
    }
  }, []);

  useEffect(() => {
    if (token && currentUser?.role === 'admin') {
      loadProducts();
    }
  }, [token, currentUser, loadProducts]);

  // Auth functions
  const login = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
      setToken(data.token);
      localStorage.setItem('lua_token', data.token);
      setCurrentUser(data.user);
      showToast(`¡Bienvenido de nuevo, ${data.user.nombre || data.user.username}!`, 'success');
      
      // Clean login inputs
      setUsername('');
      setPassword('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('lua_token');
    showToast('Sesión cerrada correctamente.', 'success');
  };

  const showAdminDashboard = token && currentUser && currentUser.role === 'admin';

  return (
    <div className="min-h-screen text-ink flex flex-col bg-bg selection:bg-nude selection:text-white">
      {notification && (
        <Alert message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      <main className={`flex-grow flex flex-col ${!showAdminDashboard ? 'items-center justify-center p-4' : 'w-full'}`}>
        {!token || !currentUser ? (
          /* Sleek Admin Login Form Card */
          <div className="w-full max-w-md bg-card rounded-lg border border-line p-8 my-auto">
            <div className="text-center mb-6">
              <span className="text-3xl font-semibold tracking-wide font-display italic text-ink block mb-2">
                Lúa Beauty
              </span>
              <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">
                Administración de Catálogo y Chatbot
              </p>
            </div>

            <form onSubmit={login} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-soft uppercase tracking-wider block">Usuario</label>
                <input
                  type="text"
                  required
                  placeholder="ej. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta text-ink"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-soft uppercase tracking-wider block">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta text-ink"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 rounded bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 text-white text-sm font-semibold cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loginLoading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
              </button>
            </form>
          </div>
        ) : currentUser.role !== 'admin' ? (
          /* Access Denied Card */
          <div className="w-full max-w-md bg-card rounded-lg border border-line p-8 text-center my-auto">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-ink mb-2">Acceso Denegado</h2>
            <p className="text-sm text-ink-soft mb-6">
              Esta cuenta no cuenta con privilegios de administrador para ver el panel de gestión.
            </p>
            <button
              onClick={logout}
              className="px-6 py-2 rounded bg-ink hover:bg-ink/90 text-white text-sm font-semibold cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          /* Render Fullscreen Administrative Dashboard for Authenticated Admins */
          <AdminDashboard
            token={token}
            products={products}
            loadProducts={loadProducts}
            showToast={showToast}
            currentUser={currentUser}
            theme={theme}
            setTheme={setTheme}
            logout={logout}
          />
        )}
      </main>

      {!showAdminDashboard && (
        <footer className="border-t border-line/40 bg-bg-light py-6 text-center text-xs text-ink-soft select-none mt-auto">
          <p>© {new Date().getFullYear()} Lúa Beauty. Consola de Administración.</p>
        </footer>
      )}
    </div>
  );
}
