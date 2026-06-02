import type { ChunkPlan, ContentBlock } from '../types';
import { DEEPSEEK_CONFIG } from '../constants';
import { serializeBlocks } from './prompts';

export function planChunks(
  blocks: ContentBlock[],
  maxCharsPerChunk = DEEPSEEK_CONFIG.maxCharsPerChunk,
): ChunkPlan[] {
  if (blocks.length === 0) {
    return [];
  }

  const plans: ChunkPlan[] = [];
  let currentBlocks: ContentBlock[] = [];
  let currentText = '';
  let index = 0;

  const flush = () => {
    if (currentBlocks.length === 0) {
      return;
    }
    plans.push({
      index,
      blocks: currentBlocks,
      text: currentText,
    });
    index += 1;
    currentBlocks = [];
    currentText = '';
  };

  for (const block of blocks) {
    const blockText = serializeBlocks([block]);
    const separator = currentText ? '\n\n' : '';
    const nextText = `${currentText}${separator}${blockText}`;

    if (currentBlocks.length > 0 && nextText.length > maxCharsPerChunk) {
      flush();
      currentBlocks = [block];
      currentText = blockText;
      continue;
    }

    currentBlocks.push(block);
    currentText = currentBlocks.length === 1 ? blockText : nextText;
  }

  flush();
  return plans;
}
