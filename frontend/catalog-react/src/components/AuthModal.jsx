import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({ onClose }) {
  const { user, login, logout } = useAuth();
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(username, password);
      onClose();
      if (userData.role === 'admin') {
        window.location.href = '/admin';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Registration removed — users interact via WhatsApp
      setError('El registro de clientes se realiza automáticamente al realizar un pedido por WhatsApp.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--color-card)] w-full max-w-sm rounded-lg border border-[var(--color-line)] shadow-2xl animate-scale-up overflow-hidden">
          <div className="p-4 border-b border-[var(--color-line)] flex justify-between items-center">
            <h3 className="font-[Fraunces] text-lg font-semibold">
              {user ? 'Mi Cuenta' : tab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            {user ? (
              <div className="space-y-3 text-center">
                <p className="font-semibold">{user.nombre || user.username}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">{user.email || 'Sin email'}</p>
                <button onClick={() => { logout(); onClose(); }} className="w-full py-2 rounded bg-rose-600 text-white text-xs font-semibold cursor-pointer hover:bg-rose-700">
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <>
                <div className="flex mb-4 border-b border-[var(--color-line)]">
                  <button
                    onClick={() => setTab('login')}
                    className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider cursor-pointer ${tab === 'login' ? 'text-[var(--color-ink)] border-b-2 border-[var(--color-ink)]' : 'text-[var(--color-ink-soft)]'}`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => setTab('register')}
                    className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider cursor-pointer ${tab === 'register' ? 'text-[var(--color-ink)] border-b-2 border-[var(--color-ink)]' : 'text-[var(--color-ink-soft)]'}`}
                  >
                    Registrarse
                  </button>
                </div>

                {error && <p className="text-xs text-rose-600 mb-3 font-semibold">{error}</p>}

                {tab === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-3">
                    <input type="text" placeholder="Usuario" required value={username} onChange={e => setUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[var(--color-line)] bg-transparent text-sm focus:outline-none focus:border-[var(--color-terracotta)]" />
                    <input type="password" placeholder="Contraseña" required value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[var(--color-line)] bg-transparent text-sm focus:outline-none focus:border-[var(--color-terracotta)]" />
                    <button type="submit" disabled={loading}
                      className="w-full py-2.5 rounded bg-[var(--color-terracotta)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--color-terracotta)]/90 disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <input type="text" placeholder="Usuario *" required value={username} onChange={e => setUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[var(--color-line)] bg-transparent text-sm focus:outline-none focus:border-[var(--color-terracotta)]" />
                    <input type="password" placeholder="Contraseña *" required value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[var(--color-line)] bg-transparent text-sm focus:outline-none focus:border-[var(--color-terracotta)]" />
                    <input type="text" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[var(--color-line)] bg-transparent text-sm focus:outline-none focus:border-[var(--color-terracotta)]" />
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[var(--color-line)] bg-transparent text-sm focus:outline-none focus:border-[var(--color-terracotta)]" />
                    <input type="tel" placeholder="WhatsApp (ej. 573001234567)" value={telefono} onChange={e => setTelefono(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[var(--color-line)] bg-transparent text-sm focus:outline-none focus:border-[var(--color-terracotta)]" />
                    <textarea placeholder="Dirección de entrega" value={direccion} onChange={e => setDireccion(e.target.value)} rows={2}
                      className="w-full px-3 py-2 rounded border border-[var(--color-line)] bg-transparent text-sm focus:outline-none focus:border-[var(--color-terracotta)] resize-none" />
                    <button type="submit" disabled={loading}
                      className="w-full py-2.5 rounded bg-[var(--color-terracotta)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--color-terracotta)]/90 disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Registrando...' : 'Crear Cuenta'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
