import React from 'react';
import { Sun, Moon, LogOut, Shield } from 'lucide-react';

export default function Header({
  currentUser,
  theme,
  setTheme,
  logout
}) {
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/30 bg-bg-light select-none">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        
        {/* Logo and Badge */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold tracking-wide font-display italic text-ink">
            Lúa Beauty
          </span>
          <span className="flex items-center gap-1 bg-ink text-white dark:bg-white dark:text-ink text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 rounded">
            <Shield className="w-3 h-3" />
            Panel Admin
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-ink transition-colors cursor-pointer"
            title="Cambiar tema"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* User info & Logout */}
          {currentUser && (
            <div className="flex items-center gap-3 pl-3 border-l border-line/60">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-semibold text-ink">
                  {currentUser.nombre || currentUser.username}
                </span>
                <span className="text-[10px] text-ink-soft opacity-75">
                  Administrador
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 cursor-pointer transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
