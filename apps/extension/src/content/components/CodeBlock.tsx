import type { CodeBlockProps } from '@/types/components';

export function CodeBlock({ code, inline = false }: CodeBlockProps) {
  if (inline) {
    return (
      <code className="bg-gray-50 dark:bg-zinc-800 text-red-600 dark:text-red-500 px-1.5 py-0.5 rounded text-xs font-mono">
        {code}
      </code>
    );
  }

  return (
    <pre className="rounded-md p-3 overflow-x-auto font-mono text-xs border border-zinc-200 dark:border-zinc-700 leading-normal my-1 bg-gray-50 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50">
      <code className="bg-transparent text-inherit">{code}</code>
    </pre>
  );
}
