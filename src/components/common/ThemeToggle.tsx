import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../lib/theme';

export const ThemeToggle: React.FC<{ className?: string; id?: string }> = ({
  className = '',
  id = 'theme-toggle-btn',
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      id={id}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className={`p-2 rounded-xl transition-all duration-200 border cursor-pointer ${
        theme === 'dark'
          ? 'bg-slate-800/80 hover:bg-slate-700 border-white/10 text-amber-400 hover:text-amber-300 shadow-md shadow-black/20'
          : 'bg-white/80 hover:bg-orange-50 border-orange-200/60 text-slate-700 hover:text-orange-600 shadow-xs'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
};
