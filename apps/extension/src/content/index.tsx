import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';
import { ReviewButton } from './components/ReviewButton';
import { ReviewPanel } from './components/ReviewPanel';
import { extractDiff } from './services/diffExtractor';
import { sanitizeDiff, validateDiffSize } from './services/sanitizer';
import { requestReview } from './services/apiClient';
import { isMergeRequestPage } from '@/utils/helpers';
import { useTheme } from './hooks/useTheme';
import cssText from './styles/index.css?inline';

const CONFIG = {
  MAX_DIFF_CHARS: 50_000
};

const reviewCache = new Map<number, string>();

function hashDiff(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function App() {
  const { isDark } = useTheme();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [review, setReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingMessage = 'Analyzing...';
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const chromeAPI = (globalThis as any).chrome;
    chromeAPI.storage.local.get(['apiKey'], (result: { apiKey?: string }) => {
      setIsConfigured(!!result.apiKey);
    });
    const listener = (changes: Record<string, { newValue?: unknown }>) => {
      if ('apiKey' in changes) {
        setIsConfigured(!!changes.apiKey.newValue);
      }
    };
    chromeAPI.storage.onChanged.addListener(listener);
    return () => chromeAPI.storage.onChanged.removeListener(listener);
  }, []);

  const handleReviewClick = async () => {
    setIsPanelOpen(true);
    setLoading(true);
    setError(null);
    setReview(null);

    try {
      const rawDiff = extractDiff();

      if (!rawDiff || rawDiff.length === 0) {
        throw new Error(
          'No diff content found. Make sure you are on a GitLab Merge Request page with visible changes.'
        );
      }

      const sanitized = sanitizeDiff(rawDiff);

      const { valid, diff } = validateDiffSize(sanitized, CONFIG.MAX_DIFF_CHARS);

      if (!valid) {
        throw new Error('Diff is empty after sanitization.');
      }

      const diffHash = hashDiff(diff);
      if (reviewCache.has(diffHash)) {
        setReview(reviewCache.get(diffHash)!);
        return;
      }

      const result = await requestReview(diff);

      reviewCache.set(diffHash, result);
      setReview(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <ReviewButton
        onClick={handleReviewClick}
        disabled={loading || !isConfigured}
        isDark={isDark}
      />
      <ReviewPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        review={review}
        loading={loading}
        error={error}
        loadingMessage={loadingMessage}
      />
    </div>
  );
}

function init() {
  if (!isMergeRequestPage()) {
    const existing = document.getElementById('merge-guard-host');
    if (existing) existing.remove();
    return;
  }

  if (document.getElementById('merge-guard-host')) {
    return;
  }

  const host = document.createElement('div');
  host.id = 'merge-guard-host';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = cssText;
  shadow.appendChild(style);

  const container = document.createElement('div');
  shadow.appendChild(container);

  createRoot(container).render(<App />);
}

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    init();
  }
}).observe(document, { subtree: true, childList: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
