import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemeMode } from '../hooks/useTheme';
import { Tooltip } from './Tooltip';

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  const toggleMode = () => {
    setMode(nextMode);
  };

  const nextMode: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light';
  const Icon = nextMode === 'dark' ? Moon : nextMode === 'auto' ? Monitor : Sun;
  const label =
    nextMode === 'dark'
      ? 'Switch to dark mode'
      : nextMode === 'auto'
      ? 'Switch to auto mode'
      : 'Switch to light mode';

  return (
    <Tooltip label={label} position="bottom">
      <button
        onClick={toggleMode}
        className="w-7 h-7 flex items-center justify-center text-zinc-500 dark:text-zinc-400 bg-transparent border-0 rounded-md cursor-pointer transition-colors duration-150 hover:text-zinc-950 dark:hover:text-zinc-50"
        aria-label="Toggle theme"
      >
        <Icon size={16} />
      </button>
    </Tooltip>
  );
}
