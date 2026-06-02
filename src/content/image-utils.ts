import type { ContentBlock } from '../shared/types';

const DECORATIVE_ALT = new Set(['', 'image', 'img', 'photo', 'picture', '图标', '图片']);

function resolveImageSrc(img: HTMLImageElement): string | null {
  const raw =
    img.currentSrc ||
    img.src ||
    img.getAttribute('src') ||
    img.getAttribute('data-src') ||
    img.getAttribute('data-original');

  if (!raw || raw.startsWith('blob:')) {
    return null;
  }

  try {
    return new URL(raw, document.baseURI).href;
  } catch {
    return null;
  }
}

export function isContentImage(img: HTMLImageElement): boolean {
  if (img.getAttribute('role') === 'presentation') {
    return false;
  }

  const src = resolveImageSrc(img);
  if (!src) {
    return false;
  }

  if (/pixel|tracking|spacer|1x1|blank\.gif|data:image\/gif/i.test(src)) {
    return false;
  }

  const width = img.naturalWidth || Number(img.getAttribute('width')) || 0;
  const height = img.naturalHeight || Number(img.getAttribute('height')) || 0;

  if (width > 0 && height > 0 && width < 40 && height < 40) {
    return false;
  }

  const rect = img.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0 && rect.width < 32 && rect.height < 32) {
    return false;
  }

  return true;
}

export function blockFromImage(
  img: HTMLImageElement,
  caption?: string,
): ContentBlock | null {
  const src = resolveImageSrc(img);
  if (!src || !isContentImage(img)) {
    return null;
  }

  const alt = img.getAttribute('alt')?.trim();
  const title = img.getAttribute('title')?.trim();
  const captionText = caption?.trim();

  return {
    type: 'image',
    src,
    alt: alt || undefined,
    caption: captionText || undefined,
    title: title || undefined,
  };
}

export function blockFromFigure(figure: Element): ContentBlock | null {
  const img = figure.querySelector('img');
  if (!img) {
    return null;
  }

  const figcaption = figure.querySelector('figcaption');
  const caption = figcaption?.textContent?.replace(/\s+/g, ' ').trim();
  return blockFromImage(img, caption);
}

export function hasTranslatableImageText(block: ContentBlock): boolean {
  if (block.type !== 'image') {
    return false;
  }

  const alt = block.alt?.trim() ?? '';
  const caption = block.caption?.trim() ?? '';

  if (caption.length > 0) {
    return true;
  }

  if (alt.length > 0 && !DECORATIVE_ALT.has(alt.toLowerCase())) {
    return true;
  }

  return false;
}
