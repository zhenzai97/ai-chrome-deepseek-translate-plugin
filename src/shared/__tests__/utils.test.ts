import { describe, expect, it } from 'vitest';
import type { ContentBlock } from '../types';
import { planChunks } from '../deepseek/chunker';
import { mapApiError } from '../deepseek/client';
import { ErrorCode } from '../constants';
import { buildExportFilename, sanitizeFilename } from '../utils/filename';
import { parseTranslatedBlocks } from '../deepseek/parser';
import { exportMarkdown } from '../../sidepanel/export/markdown';

describe('planChunks', () => {
  it('keeps single block in one chunk', () => {
    const blocks: ContentBlock[] = [{ type: 'paragraph', text: 'hello world' }];
    const chunks = planChunks(blocks, 1000);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].blocks).toHaveLength(1);
  });

  it('splits when exceeding max chars without splitting a single block', () => {
    const blocks: ContentBlock[] = [
      { type: 'paragraph', text: 'a'.repeat(500) },
      { type: 'paragraph', text: 'b'.repeat(500) },
      { type: 'paragraph', text: 'c'.repeat(500) },
    ];
    const chunks = planChunks(blocks, 900);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.blocks.length).toBeGreaterThan(0);
    }
  });
});

describe('mapApiError', () => {
  it('maps auth and quota errors', () => {
    expect(mapApiError(401)).toBe(ErrorCode.AUTH_INVALID);
    expect(mapApiError(429)).toBe(ErrorCode.QUOTA_EXCEEDED);
    expect(mapApiError(500)).toBe(ErrorCode.NETWORK_ERROR);
  });
});

describe('filename utils', () => {
  it('sanitizes invalid characters', () => {
    expect(sanitizeFilename('hello/world:test')).toBe('helloworldtest');
  });

  it('builds export filename', () => {
    const name = buildExportFilename('Test Article', 'zh-CN', 'md', new Date('2026-06-02'));
    expect(name).toBe('Test_Article_zh-CN_20260602.md');
  });
});

describe('image blocks', () => {
  it('serializes and parses image with preserved src', () => {
    const source: ContentBlock[] = [
      {
        type: 'image',
        src: 'https://example.com/a.png',
        alt: 'Diagram overview',
        caption: 'Figure 1: System architecture',
      },
    ];

    const translated = `[IMAGE]
src: https://example.com/a.png
alt: 架构总览图
caption: 图 1：系统架构`;

    const parsed = parseTranslatedBlocks(translated, source);
    expect(parsed[0].type).toBe('image');
    expect(parsed[0].src).toBe('https://example.com/a.png');
    expect(parsed[0].alt).toBe('架构总览图');
    expect(parsed[0].caption).toBe('图 1：系统架构');
  });
});

describe('exportMarkdown', () => {
  it('exports structured markdown', () => {
    const { content, filename } = exportMarkdown({
      titleTranslated: '标题',
      targetLang: 'zh-CN',
      translatedAt: '2026-06-02T00:00:00.000Z',
      blocks: [
        { type: 'heading', level: 2, text: '章节' },
        { type: 'paragraph', text: '正文' },
      ],
    });

    expect(filename.endsWith('.md')).toBe(true);
    expect(content).toContain('# 标题');
    expect(content).toContain('## 章节');
    expect(content).toContain('正文');
  });

  it('exports images in markdown', () => {
    const { content } = exportMarkdown({
      titleTranslated: '标题',
      targetLang: 'zh-CN',
      translatedAt: '2026-06-02T00:00:00.000Z',
      blocks: [
        {
          type: 'image',
          src: 'https://example.com/pic.png',
          alt: '示意图',
          caption: '图 1：示意',
        },
      ],
    });

    expect(content).toContain('![示意图](https://example.com/pic.png)');
  });
});
