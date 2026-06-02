const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;
const WHITESPACE = /\s+/g;

export function sanitizeFilename(title: string, maxLength = 80): string {
  const cleaned = title
    .replace(INVALID_FILENAME_CHARS, '')
    .replace(WHITESPACE, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .trim();

  if (!cleaned) {
    return 'translation';
  }

  return cleaned.slice(0, maxLength);
}

export function formatDateForFilename(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export function buildExportFilename(
  title: string,
  targetLang: string,
  ext: 'md' | 'pdf',
  date = new Date(),
): string {
  return `${sanitizeFilename(title)}_${targetLang}_${formatDateForFilename(date)}.${ext}`;
}
