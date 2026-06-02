import type { TranslationDoc } from '../../shared/types';
import { blockToMarkdown } from '../../shared/utils/blocks';
import { buildExportFilename } from '../../shared/utils/filename';

export function exportMarkdown(doc: TranslationDoc): {
  content: string;
  filename: string;
} {
  const lines = [
    '---',
    `title: ${doc.titleTranslated}`,
    `date: ${doc.translatedAt}`,
    `lang: ${doc.targetLang}`,
    doc.sourceUrl ? `source: ${doc.sourceUrl}` : null,
    '---',
    '',
    `# ${doc.titleTranslated}`,
    '',
    ...doc.blocks.map((block) => blockToMarkdown(block)),
  ].filter((line) => line !== null) as string[];

  return {
    content: lines.join('\n\n').replace(/\n{3,}/g, '\n\n'),
    filename: buildExportFilename(doc.titleTranslated, doc.targetLang, 'md'),
  };
}
