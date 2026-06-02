import type { ContentBlock } from '../shared/types';
import { blockFromFigure, blockFromImage } from './image-utils';

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'SVG',
  'IFRAME',
  'NAV',
  'FOOTER',
  'ASIDE',
]);

function getTextContent(element: Element): string {
  return element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function listItems(list: HTMLOListElement | HTMLUListElement): string[] {
  return Array.from(list.querySelectorAll(':scope > li')).map((li) =>
    getTextContent(li),
  );
}

export function nodeToBlocks(root: Element): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let textBuffer = '';

  const flushText = () => {
    const text = textBuffer.replace(/\s+/g, ' ').trim();
    textBuffer = '';
    if (text) {
      blocks.push({ type: 'paragraph', text });
    }
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      textBuffer += node.textContent ?? '';
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as Element;
    const tag = element.tagName;

    if (SKIP_TAGS.has(tag)) {
      return;
    }

    if (tag === 'FIGURE') {
      flushText();
      const block = blockFromFigure(element);
      if (block) {
        blocks.push(block);
      }
      return;
    }

    if (tag === 'IMG') {
      flushText();
      const block = blockFromImage(element as HTMLImageElement);
      if (block) {
        blocks.push(block);
      }
      return;
    }

    if (/^H[1-6]$/.test(tag)) {
      flushText();
      const level = Number(tag[1]);
      const text = getTextContent(element);
      if (text) {
        blocks.push({ type: 'heading', level, text });
      }
      return;
    }

    if (tag === 'UL' || tag === 'OL') {
      flushText();
      const items = listItems(element as HTMLUListElement);
      if (items.length) {
        blocks.push({ type: 'list', level: 1, items });
      }
      return;
    }

    if (tag === 'BLOCKQUOTE') {
      flushText();
      const text = getTextContent(element);
      if (text) {
        blocks.push({ type: 'blockquote', text });
      }
      return;
    }

    if (tag === 'PRE' || tag === 'CODE') {
      flushText();
      const text = element.textContent?.trim() ?? '';
      if (text) {
        blocks.push({ type: 'code', text });
      }
      return;
    }

    if (tag === 'P') {
      for (const child of Array.from(element.childNodes)) {
        walk(child);
      }
      return;
    }

    for (const child of Array.from(element.childNodes)) {
      walk(child);
    }
  };

  for (const child of Array.from(root.childNodes)) {
    walk(child);
  }
  flushText();

  return blocks;
}

export function blocksToPlainText(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'list') {
        return (block.items ?? []).join('\n');
      }
      if (block.type === 'image') {
        return [block.alt, block.caption].filter(Boolean).join(' ');
      }
      return block.text ?? '';
    })
    .filter(Boolean)
    .join('\n\n');
}
