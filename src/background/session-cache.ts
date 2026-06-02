import type { TabSession } from '../shared/types';

const sessions = new Map<number, TabSession>();

export function getSession(tabId: number): TabSession | undefined {
  return sessions.get(tabId);
}

export function getOrCreateSession(tabId: number, pageUrl: string): TabSession {
  const existing = sessions.get(tabId);
  if (existing && existing.pageUrl === pageUrl) {
    return existing;
  }

  const session: TabSession = {
    tabId,
    pageUrl,
    jobState: 'idle',
  };
  sessions.set(tabId, session);
  return session;
}

export function updateSession(tabId: number, patch: Partial<TabSession>): TabSession {
  const current = sessions.get(tabId);
  if (!current) {
    throw new Error(`Session not found for tab ${tabId}`);
  }
  const next = { ...current, ...patch };
  sessions.set(tabId, next);
  return next;
}

export function clearSession(tabId: number): void {
  sessions.delete(tabId);
}

export function initSessionListeners(): void {
  chrome.tabs.onRemoved.addListener((tabId) => {
    clearSession(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
      const session = sessions.get(tabId);
      if (session && session.pageUrl !== changeInfo.url) {
        clearSession(tabId);
      }
    }
  });
}
