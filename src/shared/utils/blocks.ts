import type { ContentBlock } from '../types';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function blockToMarkdown(block: ContentBlock): string {
  switch (block.type) {
    case 'heading': {
      const level = Math.min(Math.max(block.level ?? 1, 1), 6);
      return `${'#'.repeat(level)} ${block.text ?? ''}`.trim();
    }
    case 'paragraph':
      return block.text ?? '';
    case 'list':
      return (block.items ?? []).map((item) => `- ${item}`).join('\n');
    case 'blockquote':
      return `> ${block.text ?? ''}`;
    case 'code':
      return ['```', block.text ?? '', '```'].join('\n');
    case 'image': {
      const alt = block.alt ?? block.caption ?? '';
      const lines = [`![${alt}](${block.src ?? ''})`];
      if (block.caption && block.caption !== block.alt) {
        lines.push(`*${block.caption}*`);
      }
      return lines.join('\n');
    }
    default:
      return block.text ?? '';
  }
}

export function blockToHtml(block: ContentBlock): string {
  switch (block.type) {
    case 'heading': {
      const level = Math.min(Math.max(block.level ?? 1, 1), 6);
      return `<h${level}>${escapeHtml(block.text ?? '')}</h${level}>`;
    }
    case 'paragraph':
      return `<p>${escapeHtml(block.text ?? '')}</p>`;
    case 'list':
      return `<ul>${(block.items ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    case 'blockquote':
      return `<blockquote>${escapeHtml(block.text ?? '')}</blockquote>`;
    case 'code':
      return `<pre><code>${escapeHtml(block.text ?? '')}</code></pre>`;
    case 'image': {
      const alt = escapeHtml(block.alt ?? '');
      const src = escapeHtml(block.src ?? '');
      const caption = block.caption
        ? `<figcaption>${escapeHtml(block.caption)}</figcaption>`
        : '';
      return `<figure class="article-image"><img src="${src}" alt="${alt}" loading="lazy" referrerpolicy="no-referrer" />${caption}</figure>`;
    }
    default:
      return `<p>${escapeHtml(block.text ?? '')}</p>`;
  }
}
