import type {
  GetSessionStatePayload,
  RuntimeMessage,
  RuntimeResponse,
  SaveSettingsPayload,
  SessionStateResponse,
  TranslateStartPayload,
} from '../shared/types';
import { MessageType } from '../shared/constants';
import { dispatch, registerHandler } from './message-router';
import { initSessionListeners, getOrCreateSession } from './session-cache';
import {
  clearSettings,
  getPublicSettings,
  saveSettings,
} from './settings';
import { getSessionState, startTranslateJob } from './translate-job';

function setupMessageHandlers(): void {
  registerHandler(MessageType.GET_SETTINGS, async () => {
    const settings = await getPublicSettings();
    return { ok: true, data: settings };
  });

  registerHandler(MessageType.SAVE_SETTINGS, async (payload) => {
    await saveSettings(payload as SaveSettingsPayload);
    return { ok: true, data: { saved: true } };
  });

  registerHandler(MessageType.CLEAR_SETTINGS, async () => {
    await clearSettings();
    return { ok: true, data: { cleared: true } };
  });

  registerHandler(MessageType.GET_SESSION_STATE, async (payload) => {
    const { tabId } = payload as GetSessionStatePayload;
    const tab = await chrome.tabs.get(tabId);
    const pageUrl = tab.url ?? '';
    if (pageUrl) {
      getOrCreateSession(tabId, pageUrl);
    }
    const state = getSessionState(tabId);
    return {
      ok: true,
      data: {
        ...state,
        pageUrl: pageUrl || state.pageUrl,
      } satisfies SessionStateResponse,
    };
  });

  registerHandler(MessageType.TRANSLATE_START, async (payload) => {
    const result = await startTranslateJob(payload as TranslateStartPayload);
    if (!result.ok) {
      return {
        ok: false,
        error: { code: result.code, message: result.message },
      };
    }
    return { ok: true, data: { started: true } };
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Older Chrome versions may not support this API
  });
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  void dispatch(message, sender).then(sendResponse);
  return true;
});

initSessionListeners();
setupMessageHandlers();

export {};
