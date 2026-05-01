import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import type { Section } from '@/types/review';
import type { SectionCardProps } from '@/types/components';
import { CodeBlock } from './CodeBlock';

const BADGE_LABELS = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Issues',
  success: 'Summary'
} as const;

const SEVERITY_ICON_CLASS = {
  critical: 'text-red-600 dark:text-red-500',
  warning: 'text-amber-400',
  info: 'text-blue-500 dark:text-blue-400',
  success: 'text-emerald-500 dark:text-green-500'
} as const;

const SEVERITY_BADGE_CLASS = {
  critical:
    'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-800',
  warning:
    'bg-amber-50 dark:bg-amber-950/50 text-amber-500 border border-amber-200 dark:border-amber-700',
  info: 'bg-blue-50 dark:bg-blue-950/50 text-blue-500 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  success:
    'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 dark:text-green-500 border border-emerald-200 dark:border-emerald-800'
} as const;

function SeverityIcon({ severity }: { severity: Section['severity'] }) {
  const cls = `inline-flex items-center justify-center shrink-0 ${SEVERITY_ICON_CLASS[severity]}`;
  if (severity === 'critical')
    return (
      <span className={cls}>
        <AlertTriangle size={16} />
      </span>
    );
  if (severity === 'warning')
    return (
      <span className={cls}>
        <AlertCircle size={16} />
      </span>
    );
  if (severity === 'info')
    return (
      <span className={cls}>
        <Info size={16} />
      </span>
    );
  return (
    <span className={cls}>
      <CheckCircle2 size={16} />
    </span>
  );
}

export function SectionCard({ section }: SectionCardProps) {
  const { title, content, severity, counts } = section;

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#1a1a1a] p-3 transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-600">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-2 m-0">
          <SeverityIcon severity={severity} />
          <span>{title}</span>
        </h3>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE_CLASS[severity]}`}
        >
          {BADGE_LABELS[severity]}
        </span>
      </div>

      {/* Content */}
      <div className="text-sm leading-relaxed text-zinc-950 dark:text-zinc-50">
        {content.toLowerCase().includes('none identified') ? (
          <p className="text-zinc-800 dark:text-zinc-200 italic text-xs m-0">None identified</p>
        ) : counts ? (
          <SummaryContent content={content} />
        ) : (
          <ContentRenderer content={content} />
        )}
      </div>
    </div>
  );
}

function SummaryContent({ content }: { content: string }) {
  const lines = content.split('\n').filter(Boolean);
  const elements: any[] = [];

  lines.forEach((line, idx) => {
    if (line.includes('|')) {
      const [severity, count, description] = line.split('|');
      const severityLower = severity.toLowerCase() as 'critical' | 'warning' | 'info';
      const label =
        severityLower === 'critical'
          ? 'critical'
          : severityLower === 'warning'
          ? `warning${parseInt(count) > 1 ? 's' : ''}`
          : `suggestion${parseInt(count) > 1 ? 's' : ''}`;

      elements.push(
        <div key={idx} className="flex items-start gap-2 mb-2.5">
          <span
            className={`inline-flex shrink-0 mt-0.5 leading-none ${SEVERITY_ICON_CLASS[severityLower]}`}
          >
            {severityLower === 'critical' ? (
              <AlertTriangle size={16} />
            ) : severityLower === 'warning' ? (
              <AlertCircle size={16} />
            ) : (
              <Info size={16} />
            )}
          </span>
          <div className="flex-1">
            <span className={`font-semibold ${SEVERITY_ICON_CLASS[severityLower]}`}>
              {count} {label}
            </span>
            <span className="text-zinc-600 dark:text-zinc-400"> - {description}</span>
          </div>
        </div>
      );
    } else {
      elements.push(
        <p key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 m-0">
          <InlineFormatter text={line} />
        </p>
      );
    }
  });

  return <div>{elements}</div>;
}

function ContentRenderer({ content }: { content: string }) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
  const parts: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = [];

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', lang: match[1] || '', content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.substring(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return (
    <div className="flex flex-col gap-2">
      {parts.map((part, idx) =>
        part.type === 'code' ? (
          <CodeBlock key={idx} code={part.content} language={part.lang} />
        ) : (
          <TextContent key={idx} text={part.content} />
        )
      )}
    </div>
  );
}

function TextContent({ text }: { text: string }) {
  const lines = text
    .split('\n')
    .map((line) => {
      let l = line.trim();
      l = l.replace(/^#{2,}\s*/, '');
      l = l.replace(/^\d+\.\s+/, '');
      l = l.replace(/^[a-z]\)\s+/i, '');
      l = l.replace(/^[ivxlcdm]+\.\s+/i, '');
      l = l.replace(/^(Fix|Suggestion):\s*/, '**Suggestion:** ');
      return l;
    })
    .filter(Boolean);

  const elements: any[] = [];
  let currentList: string[] = [];

  lines.forEach((line, idx) => {
    if (line.startsWith('- ')) {
      currentList.push(line.substring(2));
    } else {
      if (currentList.length > 0) {
        elements.push(
          <ul
            key={`list-${idx}`}
            className="list-disc list-inside flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400 my-1"
          >
            {currentList.map((item, i) => (
              <li key={i}>
                <InlineFormatter text={item} />
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
      const isSuggestion = line.startsWith('**Suggestion:**');
      elements.push(
        <p
          key={`p-${idx}`}
          className={[
            'text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed my-1',
            isSuggestion
              ? 'bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-2 rounded border border-emerald-200 dark:border-emerald-800'
              : ''
          ].join(' ')}
        >
          <InlineFormatter text={line} />
        </p>
      );
    }
  });

  if (currentList.length > 0) {
    elements.push(
      <ul
        key="list-final"
        className="list-disc list-inside flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400 my-1"
      >
        {currentList.map((item, i) => (
          <li key={i}>
            <InlineFormatter text={item} />
          </li>
        ))}
      </ul>
    );
  }

  return <div className="flex flex-col gap-1.5">{elements}</div>;
}

function InlineFormatter({ text }: { text: string }) {
  const inlineCodeRegex = /`([^`]+)`/g;
  const parts: Array<{ type: 'text' | 'code'; content: string }> = [];

  let lastIndex = 0;
  let match;

  while ((match = inlineCodeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  if (parts.length === 0) {
    return <span>{text}</span>;
  }

  return (
    <>
      {parts.map((part, idx) =>
        part.type === 'code' ? (
          <CodeBlock key={idx} code={part.content} inline />
        ) : (
          <BoldFormatter key={idx} text={part.content} />
        )
      )}
    </>
  );
}

function BoldFormatter({ text }: { text: string }) {
  const boldRegex = /\*\*(.+?)\*\*/g;
  const parts = text.split(boldRegex);

  return (
    <>
      {parts.map((part, idx) =>
        idx % 2 === 0 ? (
          <span key={idx}>{part}</span>
        ) : (
          <strong key={idx} className="font-semibold text-zinc-950 dark:text-zinc-50">
            {part}
          </strong>
        )
      )}
    </>
  );
}
