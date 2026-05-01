const DIFF_SELECTORS = [
  '.diff-content',
  '.js-file-content',
  '.diff-wrap-lines',
  '.code.js-syntax-highlight',
  '[data-testid="file-content"]',
  '.diff-viewer',
];

export function extractDiff(): string {
  for (const selector of DIFF_SELECTORS) {
    const nodes = document.querySelectorAll(selector);
    if (nodes.length === 0) continue;

    const texts: string[] = [];
    nodes.forEach((node) => {
      const text = (node.textContent ?? '').trim();
      if (text.length > 0) texts.push(text);
    });

    if (texts.length > 0) {
      return texts.join('\n');
    }
  }

  const lines = document.querySelectorAll('.line_content');
  if (lines.length > 0) {
    const texts: string[] = [];
    lines.forEach((line) => {
      const text = (line.textContent ?? '').trim();
      if (text) texts.push(text);
    });
    return texts.join('\n');
  }

  return '';
}
