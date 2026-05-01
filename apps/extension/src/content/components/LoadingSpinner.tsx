import type { LoadingSpinnerProps } from '@/types/components';

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-10 h-10 mb-3">
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: '3px solid currentColor', opacity: 0.15 }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '3px solid currentColor',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite'
          }}
        />
      </div>
      <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium m-0">{message}</p>
    </div>
  );
}
