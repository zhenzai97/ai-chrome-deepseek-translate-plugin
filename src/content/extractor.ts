import { Readability } from '@mozilla/readability';
import type { ArticlePayload } from '../shared/types';
import { blocksToPlainText, nodeToBlocks } from './dom-to-blocks';

const FALLBACK_SELECTORS = ['article', 'main', '[role="main"]', '.post-content', '.article-content', '.entry-content'];

function getFallbackRoot(): Element | null {
  for (const selector of FALLBACK_SELECTORS) {
    const element = document.querySelector(selector);
    if (element && getTextLength(element) > 200) {
      return element;
    }
  }
  return document.body;
}

function getTextLength(element: Element): number {
  return element.textContent?.replace(/\s+/g, ' ').trim().length ?? 0;
}

function extractWithReadability(): Element | null {
  const clone = document.cloneNode(true) as Document;
  const reader = new Readability(clone, { charThreshold: 100 });
  const article = reader.parse();
  if (!article?.content) {
    return null;
  }

  const container = document.createElement('div');
  container.innerHTML = article.content;
  return container;
}

export function extractArticle(): ArticlePayload {
  const url = location.href;
  const langHint = document.documentElement.lang || undefined;
  let title = document.title.trim();
  let blocks: ReturnType<typeof nodeToBlocks> = [];
  let byline: string | undefined;

  const readableRoot = extractWithReadability();
  if (readableRoot) {
    blocks = nodeToBlocks(readableRoot);
    const h1 = readableRoot.querySelector('h1');
    if (h1?.textContent?.trim()) {
      title = h1.textContent.trim();
    }
  }

  if (blocks.length === 0) {
    const fallback = getFallbackRoot();
    if (fallback) {
      blocks = nodeToBlocks(fallback);
      const h1 = fallback.querySelector('h1');
      if (h1?.textContent?.trim()) {
        title = h1.textContent.trim();
      }
    }
  }

  const plainText = blocksToPlainText(blocks);

  return {
    url,
    title: title || 'Untitled',
    byline,
    langHint,
    blocks,
    plainText,
  };
}
