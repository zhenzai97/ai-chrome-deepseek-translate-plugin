import type {
  RuntimeMessage,
  SessionStateResponse,
  TranslateStartPayload,
  TranslateSuccessPayload,
} from '../shared/types';
import {
  ERROR_MESSAGES,
  ErrorCode,
  MessageType,
} from '../shared/constants';
import { DeepSeekError } from '../shared/deepseek/client';
import { translateArticle } from '../shared/deepseek';
import { extractFromTab } from './extract';
import { getOrCreateSession, getSession, updateSession } from './session-cache';
import { getSettings } from './settings';

const activeJobs = new Map<number, AbortController>();

function notifySidePanel(message: RuntimeMessage): void {
  chrome.runtime.sendMessage(message).catch(() => {
    // Side panel may be closed
  });
}

export async function startTranslateJob(
  payload: TranslateStartPayload,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const { tabId, targetLang, sourceLang } = payload;
  const tab = await chrome.tabs.get(tabId);
  const pageUrl = tab.url ?? '';

  if (!pageUrl.startsWith('http')) {
    return {
      ok: false,
      code: ErrorCode.NO_CONTENT,
      message: ERROR_MESSAGES.NO_CONTENT,
    };
  }

  const session = getOrCreateSession(tabId, pageUrl);
  if (session.jobState === 'extracting' || session.jobState === 'translating') {
    return {
      ok: false,
      code: ErrorCode.BUSY,
      message: ERROR_MESSAGES.BUSY,
    };
  }

  const settings = await getSettings();
  if (!settings.apiKey) {
    return {
      ok: false,
      code: ErrorCode.AUTH_INVALID,
      message: ERROR_MESSAGES.AUTH_INVALID,
    };
  }

  const existing = activeJobs.get(tabId);
  existing?.abort();
  const controller = new AbortController();
  activeJobs.set(tabId, controller);

  updateSession(tabId, {
    jobState: 'extracting',
    progress: undefined,
    error: undefined,
    translationDoc: undefined,
    pageUrl,
  });

  void runTranslateJob({
    tabId,
    pageUrl,
    targetLang,
    sourceLang: sourceLang ?? settings.sourceLang,
    apiKey: settings.apiKey,
    signal: controller.signal,
  });

  return { ok: true };
}

async function runTranslateJob(params: {
  tabId: number;
  pageUrl: string;
  targetLang: string;
  sourceLang: string;
  apiKey: string;
  signal: AbortSignal;
}): Promise<void> {
  const { tabId, pageUrl, targetLang, sourceLang, apiKey, signal } = params;

  try {
    const article = await extractFromTab(tabId);
    if (signal.aborted) {
      return;
    }

    if (!article.blocks.length) {
      throw new DeepSeekError(ErrorCode.NO_CONTENT);
    }

    updateSession(tabId, {
      jobState: 'translating',
      extractedArticle: article,
      progress: { current: 0, total: 1 },
    });

    const translationDoc = await translateArticle({
      apiKey,
      blocks: article.blocks,
      title: article.title,
      targetLang,
      sourceLang,
      sourceUrl: article.url,
      signal,
      onProgress: (current, total) => {
        updateSession(tabId, {
          jobState: 'translating',
          progress: { current, total },
        });
        notifySidePanel({
          type: MessageType.TRANSLATE_PROGRESS,
          payload: { tabId, current, total },
        });
      },
    });

    if (signal.aborted) {
      return;
    }

    updateSession(tabId, {
      jobState: 'done',
      progress: undefined,
      error: undefined,
      translationDoc,
    });

    const successPayload: TranslateSuccessPayload = { tabId, translationDoc };
    notifySidePanel({
      type: MessageType.TRANSLATE_SUCCESS,
      payload: successPayload,
    });
  } catch (error) {
    if (signal.aborted) {
      return;
    }

    const code =
      error instanceof DeepSeekError ? error.code : ErrorCode.UNKNOWN;
    const message =
      error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN;

    updateSession(tabId, {
      jobState: 'error',
      error: { code, message },
      progress: undefined,
    });

    notifySidePanel({
      type: MessageType.TRANSLATE_ERROR,
      payload: { tabId, code, message },
    });
  } finally {
    activeJobs.delete(tabId);
  }
}

export function getSessionState(tabId: number): SessionStateResponse {
  const session = getSession(tabId);
  if (!session) {
    return { jobState: 'idle' };
  }
  return {
    jobState: session.jobState,
    progress: session.progress,
    error: session.error,
    translationDoc: session.translationDoc,
    pageUrl: session.pageUrl,
  };
}
