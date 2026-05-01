import { Sparkles } from 'lucide-react';
import type { ReviewButtonProps } from '@/types/components';

export function ReviewButton({ onClick, disabled = false, isDark = false }: ReviewButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'fixed bottom-4 right-4 z-extension-button',
        'inline-flex items-center justify-center gap-1.5',
        'px-4 py-2 rounded-md',
        'text-sm font-medium leading-none whitespace-nowrap',
        'border transition-all duration-150 shadow-sm',
        disabled
          ? isDark
            ? 'bg-zinc-700 border-zinc-600 text-zinc-400 opacity-60'
            : 'bg-zinc-100 border-zinc-200 text-zinc-400 opacity-60'
          : isDark
          ? 'bg-zinc-800 border-zinc-600 text-zinc-50 cursor-pointer hover:bg-zinc-700'
          : 'bg-zinc-900 border-zinc-700 text-zinc-50 cursor-pointer hover:bg-zinc-950'
      ].join(' ')}
    >
      <Sparkles
        size={15}
        className={
          disabled
            ? 'text-zinc-500'
            : isDark
            ? 'text-amber-400 animate-pulse'
            : 'text-amber-500 animate-pulse'
        }
      />
      Review
    </button>
  );
}
