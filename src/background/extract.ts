import type { ArticlePayload } from '../shared/types';
import { MessageType } from '../shared/constants';
import contentScriptUrl from '../content/index.ts?script';

async function requestExtract(tabId: number): Promise<ArticlePayload> {
  const response = await chrome.tabs.sendMessage(tabId, {
    type: MessageType.EXTRACT_ARTICLE,
  });

  if (!response?.ok) {
    throw new Error(response?.error?.message ?? '正文提取失败');
  }

  return response.data as ArticlePayload;
}

function isMissingReceiverError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('receiving end does not exist') ||
    message.includes('could not establish connection')
  );
}

function isHostPermissionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message.includes('Cannot access contents of url') ||
    error.message.includes('Extension manifest must request permission')
  );
}

export async function extractFromTab(tabId: number): Promise<ArticlePayload> {
  try {
    return await requestExtract(tabId);
  } catch (error) {
    if (!isMissingReceiverError(error) && !isHostPermissionError(error)) {
      throw error;
    }
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [contentScriptUrl],
    });
  } catch (error) {
    if (isHostPermissionError(error)) {
      throw new Error(
        '无法访问当前页面。请重新加载扩展后刷新该标签页，或确认扩展已授予网站访问权限。',
      );
    }
    throw error;
  }

  return requestExtract(tabId);
}
