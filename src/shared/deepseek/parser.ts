import type { ContentBlock, TranslatedBlock } from '../types';
import { BLOCK_SEPARATOR } from '../constants';

const HEADING_RE = /^\[HEADING:(\d+)\]\s*(.*)$/;
const PARAGRAPH_RE = /^\[PARAGRAPH\]\s*(.*)$/;
const LIST_RE = /^\[LIST:(\d+)\]\s*\n([\s\S]*)$/;
const BLOCKQUOTE_RE = /^\[BLOCKQUOTE\]\s*(.*)$/;
const CODE_RE = /^\[CODE\]\s*\n([\s\S]*)$/;
const IMAGE_RE = /^\[IMAGE\]\s*\n?([\s\S]*)$/;

function parseImageFields(body: string, fallback?: ContentBlock): TranslatedBlock {
  let src = fallback?.type === 'image' ? fallback.src ?? '' : '';
  let alt = fallback?.type === 'image' ? fallback.alt : undefined;
  let caption = fallback?.type === 'image' ? fallback.caption : undefined;

  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('src:')) {
      const value = trimmed.slice(4).trim();
      if (value) {
        src = value;
      }
    } else if (trimmed.startsWith('alt:')) {
      const value = trimmed.slice(4).trim();
      alt = value || undefined;
    } else if (trimmed.startsWith('caption:')) {
      const value = trimmed.slice(8).trim();
      caption = value || undefined;
    }
  }

  return {
    type: 'image',
    src,
    alt,
    caption,
    title: fallback?.type === 'image' ? fallback.title : undefined,
  };
}

function mergeImageFromSource(
  parsed: TranslatedBlock,
  source?: ContentBlock,
): TranslatedBlock {
  if (parsed.type !== 'image' || source?.type !== 'image') {
    return parsed;
  }

  return {
    ...parsed,
    src: parsed.src || source.src,
    alt: parsed.alt !== undefined ? parsed.alt : source.alt,
    caption: parsed.caption !== undefined ? parsed.caption : source.caption,
    title: parsed.title ?? source.title,
  };
}

function parseSingleBlock(raw: string, fallback?: ContentBlock): TranslatedBlock {
  const text = raw.trim();
  if (!text) {
    return fallback ?? { type: 'paragraph', text: '' };
  }

  const image = text.match(IMAGE_RE);
  if (image) {
    return parseImageFields(image[1], fallback);
  }

  const heading = text.match(HEADING_RE);
  if (heading) {
    return {
      type: 'heading',
      level: Number(heading[1]),
      text: heading[2].trim(),
    };
  }

  const paragraph = text.match(PARAGRAPH_RE);
  if (paragraph) {
    return { type: 'paragraph', text: paragraph[1].trim() };
  }

  const list = text.match(LIST_RE);
  if (list) {
    const items = list[2]
      .split('\n')
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter(Boolean);
    return { type: 'list', level: Number(list[1]), items };
  }

  const quote = text.match(BLOCKQUOTE_RE);
  if (quote) {
    return { type: 'blockquote', text: quote[1].trim() };
  }

  const code = text.match(CODE_RE);
  if (code) {
    return { type: 'code', text: code[1] };
  }

  if (fallback?.type === 'image') {
    return parseImageFields(text, fallback);
  }

  if (fallback) {
    return { ...fallback, text };
  }

  return { type: 'paragraph', text };
}

export function parseTranslatedBlocks(
  content: string,
  sourceBlocks: ContentBlock[],
): TranslatedBlock[] {
  const parts = content
    .split(BLOCK_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return sourceBlocks.map((block) => ({ ...block }));
  }

  const mapPart = (part: string, index: number) => {
    const source = sourceBlocks[index];
    const parsed = parseSingleBlock(part, source);
    return mergeImageFromSource(parsed, source);
  };

  if (parts.length === sourceBlocks.length) {
    return parts.map(mapPart);
  }

  if (parts.length === 1 && sourceBlocks.length === 1) {
    return [mapPart(parts[0], 0)];
  }

  return parts.map((part, index) => mapPart(part, index));
}

export function mergeTranslatedBlocks(chunks: TranslatedBlock[][]): TranslatedBlock[] {
  return chunks.flat();
}
