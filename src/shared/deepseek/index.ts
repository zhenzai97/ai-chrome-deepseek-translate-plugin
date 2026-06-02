import type { ContentBlock, TranslatedBlock, TranslationDoc } from '../types';
import { ErrorCode } from '../constants';
import { planChunks } from './chunker';
import { chatCompletion, DeepSeekError } from './client';
import { mergeTranslatedBlocks, parseTranslatedBlocks } from './parser';
import { buildSystemPrompt, buildUserPrompt, serializeBlocks } from './prompts';

export interface TranslateArticleParams {
  apiKey: string;
  blocks: ContentBlock[];
  title: string;
  targetLang: string;
  sourceLang: string;
  sourceUrl?: string;
  onProgress?: (current: number, total: number) => void;
  signal?: AbortSignal;
}

export async function translateArticle(
  params: TranslateArticleParams,
): Promise<TranslationDoc> {
  const chunks = planChunks(params.blocks);
  if (chunks.length === 0) {
    throw new DeepSeekError(ErrorCode.NO_CONTENT);
  }

  const translatedChunks: TranslatedBlock[][] = [];
  const systemPrompt = buildSystemPrompt();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const { content } = await chatCompletion(
      params.apiKey,
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: buildUserPrompt(chunk.text, params.targetLang, params.sourceLang),
        },
      ],
      { signal: params.signal },
    );

    translatedChunks.push(parseTranslatedBlocks(content, chunk.blocks));
    params.onProgress?.(i + 1, chunks.length);
  }

  const mergedBlocks = mergeTranslatedBlocks(translatedChunks);
  const titleBlock = mergedBlocks.find((block) => block.type === 'heading' && block.level === 1);
  const titleTranslated =
    titleBlock?.text?.trim() ||
    (mergedBlocks[0]?.type === 'heading' ? mergedBlocks[0].text?.trim() : '') ||
    params.title;

  return {
    titleTranslated,
    blocks: mergedBlocks,
    targetLang: params.targetLang,
    translatedAt: new Date().toISOString(),
    sourceUrl: params.sourceUrl,
  };
}

export function estimateChunkCount(blocks: ContentBlock[]): number {
  return planChunks(blocks).length;
}

export { serializeBlocks };
