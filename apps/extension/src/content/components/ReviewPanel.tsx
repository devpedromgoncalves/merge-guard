import { useState, useRef } from 'react';
import { X, XCircle, Copy, Check, Maximize2, Minimize2, MessageSquarePlus } from 'lucide-react';
import type { Section } from '@/types/review';
import type { ReviewPanelProps } from '@/types/components';
import { SectionCard } from './SectionCard';
import { LoadingSpinner } from './LoadingSpinner';
import { Tooltip } from './Tooltip';

export function ReviewPanel({
  isOpen,
  onClose,
  review,
  loading,
  error,
  loadingMessage = 'Analyzing...'
}: ReviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [filled, setFilled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExpanded) return;
    e.preventDefault();
    const rect = panelRef.current?.getBoundingClientRect();
    const origX = rect?.left ?? window.innerWidth - 480 - 16;
    const origY = rect?.top ?? 72;
    const startX = e.clientX;
    const startY = e.clientY;
    const onMove = (me: MouseEvent) => {
      setPos({ x: origX + (me.clientX - startX), y: origY + (me.clientY - startY) });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleCopy = () => {
    if (!review) return;
    navigator.clipboard.writeText(review).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFillComment = () => {
    if (!review) return;

    const selectors = [
      'textarea[name="note[note]"]',
      'textarea.js-gfm-input',
      'textarea.note-textarea',
      '#note_note',
      'textarea[placeholder*="comment" i]',
      'textarea[placeholder*="write" i]'
    ];

    for (const selector of selectors) {
      const textarea = document.querySelector(selector) as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = review;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        textarea.focus();
        setFilled(true);
        setTimeout(() => setFilled(false), 2000);
        return;
      }
    }

    navigator.clipboard.writeText(review).then(() => {
      setFilled(true);
      setTimeout(() => setFilled(false), 2000);
    });
  };

  const sections = review ? parseReview(review) : [];

  return (
    <div
      ref={panelRef}
      className={[
        'fixed z-extension-panel flex flex-col overflow-hidden bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-md',
        isExpanded ? 'top-4 left-4 bottom-4 right-4 w-auto' : 'w-[480px] max-h-[85vh] min-h-[200px]'
      ].join(' ')}
      style={
        !isExpanded
          ? pos
            ? { left: pos.x, top: pos.y }
            : { right: '1rem', top: '72px' }
          : undefined
      }
    >
      <div
        onMouseDown={handleDragStart}
        style={!isExpanded ? { cursor: 'grab' } : undefined}
        className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 select-none"
      >
        <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Code Review</span>
        <div className="flex items-center gap-1">
          <Tooltip label={filled ? 'Added!' : 'Add comment to MR'} position="bottom">
            <button
              onClick={handleFillComment}
              disabled={!review}
              className={[
                'w-7 h-7 flex items-center justify-center bg-transparent border-0 rounded-md transition-colors duration-150',
                filled
                  ? 'text-emerald-500 dark:text-green-500 cursor-pointer'
                  : !review
                  ? 'text-zinc-300 dark:text-zinc-400 opacity-40 cursor-default pointer-events-none'
                  : 'text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-950 dark:hover:text-zinc-50'
              ].join(' ')}
              aria-label="Add to MR comment"
            >
              {filled ? <Check size={16} /> : <MessageSquarePlus size={16} />}
            </button>
          </Tooltip>
          <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'} position="bottom">
            <button
              onClick={handleCopy}
              disabled={!review}
              className={[
                'w-7 h-7 flex items-center justify-center bg-transparent border-0 rounded-md transition-colors duration-150',
                copied
                  ? 'text-emerald-500 dark:text-green-500 cursor-pointer'
                  : !review
                  ? 'text-zinc-300 dark:text-zinc-400 opacity-40 cursor-default pointer-events-none'
                  : 'text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-950 dark:hover:text-zinc-50'
              ].join(' ')}
              aria-label="Copy review"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </Tooltip>
          <Tooltip label={isExpanded ? 'Minimize' : 'Maximize'} position="bottom">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              disabled={!!error}
              type="button"
              aria-label={isExpanded ? 'Minimize' : 'Maximize'}
              className={[
                'w-7 h-7 flex items-center justify-center bg-transparent border-0 rounded-md transition-colors duration-150',
                error
                  ? 'text-zinc-300 dark:text-zinc-400 opacity-40 cursor-default pointer-events-none'
                  : 'text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-950 dark:hover:text-zinc-50'
              ].join(' ')}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </Tooltip>
          <Tooltip label="Close" position="bottom">
            <button
              onClick={onClose}
              type="button"
              aria-label="Close"
              className="w-7 h-7 flex items-center justify-center text-zinc-500 dark:text-zinc-400 bg-transparent border-0 rounded-md cursor-pointer transition-colors duration-150 hover:text-zinc-950 dark:hover:text-zinc-50"
            >
              <X size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading && <LoadingSpinner message={loadingMessage} />}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-start gap-3 px-3 py-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-950/50 rounded-lg w-full">
              <XCircle size={20} className="text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-500 mb-1 mt-0">
                  Error
                </h3>
                <p className="text-sm text-red-600 dark:text-red-500 m-0">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && sections.length > 0 && (
          <div className="flex flex-col gap-2">
            {sections.map((section, idx) =>
              section.type === 'section' ? (
                <SectionCard key={idx} section={section} />
              ) : (
                <p key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 m-0">
                  {section.content}
                </p>
              )
            )}
          </div>
        )}

        {!loading && !error && sections.length === 0 && review && (
          <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
            {review}
          </div>
        )}
      </div>
    </div>
  );
}

function parseReview(
  rawReview: string
): Array<{ type: 'intro'; content: string } | ({ type: 'section' } & Section)> {
  const sections: any[] = [];

  const allMatches: any[] = [];
  let match;

  const sectionRegex2 = /^### (.+)$/gm;
  while ((match = sectionRegex2.exec(rawReview)) !== null) {
    const title = stripEmoji(match[1].trim());
    allMatches.push({
      type: 'section',
      index: match.index,
      length: match[0].length,
      title: title
    });
  }

  allMatches.sort((a, b) => a.index - b.index);

  let lastIndex = 0;

  const mergedSections = new Map<
    string,
    { title: string; content: string[]; severity: Section['severity'] }
  >();
  const sectionOrder: string[] = [];

  allMatches.forEach((match, i) => {
    if (match.index > lastIndex) {
      const intro = rawReview.substring(lastIndex, match.index).trim();
      if (intro && !intro.startsWith('---')) sections.push({ type: 'intro', content: intro });
    }

    const contentStart = match.index + match.length;
    const nextMatch = allMatches[i + 1];
    const contentEnd = nextMatch ? nextMatch.index : rawReview.length;
    const content = rawReview.substring(contentStart, contentEnd).trim();

    const key = match.title.toLowerCase().trim();
    if (!mergedSections.has(key)) {
      mergedSections.set(key, {
        title: match.title,
        content: [],
        severity: mapTitleToSeverity(match.title)
      });
      sectionOrder.push(key);
    }
    if (content) mergedSections.get(key)!.content.push(content);

    lastIndex = contentEnd;
  });

  const summaryKey = sectionOrder.find((k) => k === 'summary' || k.includes('summary'));
  for (const key of sectionOrder) {
    if (key === summaryKey) continue;
    const entry = mergedSections.get(key)!;
    sections.push({
      type: 'section',
      title: entry.title,
      content: entry.content.join('\n\n'),
      severity: entry.severity
    });
  }

  const counts = { critical: 0, warning: 0, info: 0 };
  for (const key of sectionOrder) {
    if (key === summaryKey) continue;
    const s = mergedSections.get(key)!;
    if (s.severity in counts) counts[s.severity as keyof typeof counts]++;
  }
  sections.push({
    type: 'section',
    title: 'Summary',
    content: buildSummaryMessage(counts),
    severity: 'success',
    counts
  });

  return sections;
}

function stripEmoji(text: string): string {
  return text
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F950}-\u{1F9FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}]/gu,
      ''
    )
    .trim();
}

function buildSummaryMessage(counts: { critical: number; warning: number; info: number }): string {
  const { critical, warning, info } = counts;
  const lines: string[] = [];

  if (critical === 0 && warning === 0 && info === 0) {
    return 'No significant issues found. This MR looks good to merge.';
  }

  if (critical > 0) {
    lines.push(
      `CRITICAL|${critical}|These must be resolved before merging. They indicate bugs, security vulnerabilities, or breaking changes that can impact production.`
    );
  }

  if (warning > 0) {
    lines.push(
      `WARNING|${warning}|These should be reviewed and addressed where possible. They may not block the merge but can lead to technical debt or unexpected behavior.`
    );
  }

  if (info > 0) {
    lines.push(
      `INFO|${info}|Minor improvements that can enhance code quality, readability, or maintainability.`
    );
  }

  const recommendation =
    critical > 0
      ? 'This MR is **not ready to merge** until critical issues are fixed.'
      : warning > 0
      ? 'This MR can be merged after reviewing the warnings.'
      : 'This MR can be merged. Consider the suggestions for a cleaner codebase.';

  return lines.join('\n') + '\n\n' + recommendation;
}

function mapTitleToSeverity(title: string): Section['severity'] {
  const lower = title.toLowerCase();
  if (lower.includes('bug') || lower.includes('security') || lower.includes('breaking'))
    return 'critical';
  if (lower.includes('hardcod') || lower.includes('async') || lower.includes('error handling'))
    return 'warning';
  if (lower.includes('summary') || lower.includes('conclusion') || lower.includes('overall'))
    return 'success';
  return 'info';
}
