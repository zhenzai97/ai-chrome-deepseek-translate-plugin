import { MessageType } from '../shared/constants';
import { extractArticle } from './extractor';

const GLOBAL_FLAG = '__deepseekTranslateContentLoaded';

function registerMessageListener(): void {
  const win = window as Window & { [GLOBAL_FLAG]?: boolean };
  if (win[GLOBAL_FLAG]) {
    return;
  }
  win[GLOBAL_FLAG] = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== MessageType.EXTRACT_ARTICLE) {
      return false;
    }

    try {
      const data = extractArticle();
      sendResponse({ ok: true, data });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      sendResponse({
        ok: false,
        error: { code: 'UNKNOWN', message: err.message },
      });
    }

    return true;
  });
}

registerMessageListener();

export {};
