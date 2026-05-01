export function sanitizeDiff(raw: string): string {
  if (typeof raw !== 'string') return '';

  return raw
    .replace(/\x00/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

export function validateDiffSize(diff: string, maxSize: number): {
  valid: boolean;
  truncated: boolean;
  diff: string;
} {
  if (diff.length === 0) {
    return { valid: false, truncated: false, diff };
  }

  if (diff.length <= maxSize) {
    return { valid: true, truncated: false, diff };
  }

  const truncated = diff.substring(0, maxSize);
  const lastNewline = truncated.lastIndexOf('\n');
  const finalDiff = lastNewline > 0 ? truncated.substring(0, lastNewline) : truncated;

  return { valid: true, truncated: true, diff: finalDiff };
}
