import type { ContentBlock } from '../types';
import { BLOCK_SEPARATOR } from '../constants';
import { getLanguageNameForPrompt } from '../utils/language';

export function buildSystemPrompt(): string {
  return [
    '你是一名专业翻译。',
    '请将用户提供的文章内容准确翻译为目标语言。',
    '必须保留原文的结构层次（标题、段落、列表、引用、代码块、图片块）。',
    '每个内容块之间使用 exactly 这一分隔符：',
    BLOCK_SEPARATOR,
    '图片块格式为 [IMAGE]，其中 src 行必须原样保留 URL，不得修改或删除。',
    '请翻译图片的 alt 与 caption：若为空、纯装饰性（如“图片”“image”）或与内容无关可留空；',
    '若 alt/caption 描述图中可见文字或图片含义，则翻译为目标语言。',
    '只输出译文，不要添加解释、注释或前后缀说明。',
  ].join('\n');
}

export function buildUserPrompt(
  chunkText: string,
  targetLang: string,
  sourceLang: string,
): string {
  const target = getLanguageNameForPrompt(targetLang);
  const source =
    sourceLang === 'auto'
      ? '自动检测源语言'
      : getLanguageNameForPrompt(sourceLang);

  return [
    `源语言：${source}`,
    `目标语言：${target}`,
    '请翻译以下文章片段，保持块分隔符不变：',
    '',
    chunkText,
  ].join('\n');
}

export function serializeBlocks(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return `[HEADING:${block.level ?? 1}] ${block.text ?? ''}`;
        case 'paragraph':
          return `[PARAGRAPH] ${block.text ?? ''}`;
        case 'list':
          return `[LIST:${block.level ?? 1}]\n${(block.items ?? []).map((item) => `- ${item}`).join('\n')}`;
        case 'blockquote':
          return `[BLOCKQUOTE] ${block.text ?? ''}`;
        case 'code':
          return `[CODE]\n${block.text ?? ''}`;
        case 'image':
          return [
            '[IMAGE]',
            `src: ${block.src ?? ''}`,
            `alt: ${block.alt ?? ''}`,
            `caption: ${block.caption ?? ''}`,
          ].join('\n');
        default:
          return block.text ?? '';
      }
    })
    .join(BLOCK_SEPARATOR);
}
