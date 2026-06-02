import type { RuntimeMessage, RuntimeResponse } from '../types';

export function sendMessage<TPayload, TResponse>(
  message: RuntimeMessage<TPayload>,
): Promise<RuntimeResponse<TResponse>> {
  return chrome.runtime.sendMessage(message);
}

export function onMessage<TPayload, TResponse>(
  handler: (
    message: RuntimeMessage<TPayload>,
    sender: chrome.runtime.MessageSender,
  ) => Promise<RuntimeResponse<TResponse>> | RuntimeResponse<TResponse>,
): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    Promise.resolve(handler(message, sender))
      .then(sendResponse)
      .catch((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        sendResponse({
          ok: false,
          error: { code: 'UNKNOWN', message: err.message },
        });
      });
    return true;
  });
}

export async function getActiveTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('无法获取当前标签页');
  }
  return tab.id;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  downloadBlob(blob, filename);
}
