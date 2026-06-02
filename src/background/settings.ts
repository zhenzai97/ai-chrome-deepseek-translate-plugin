import type { PublicSettings, Settings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';

const STORAGE_KEYS = {
  apiKey: 'apiKey',
  defaultTargetLang: 'defaultTargetLang',
  sourceLang: 'sourceLang',
  lastDownloadFormat: 'lastDownloadFormat',
} as const;

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '****';
  }
  return `${apiKey.slice(0, 3)}****${apiKey.slice(-4)}`;
}

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
  return {
    apiKey: stored[STORAGE_KEYS.apiKey] as string | undefined,
    defaultTargetLang:
      (stored[STORAGE_KEYS.defaultTargetLang] as string) ??
      DEFAULT_SETTINGS.defaultTargetLang,
    sourceLang:
      (stored[STORAGE_KEYS.sourceLang] as string) ?? DEFAULT_SETTINGS.sourceLang,
    lastDownloadFormat:
      (stored[STORAGE_KEYS.lastDownloadFormat] as Settings['lastDownloadFormat']) ??
      DEFAULT_SETTINGS.lastDownloadFormat,
  };
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const settings = await getSettings();
  return {
    hasApiKey: Boolean(settings.apiKey),
    maskedApiKey: settings.apiKey ? maskApiKey(settings.apiKey) : undefined,
    defaultTargetLang: settings.defaultTargetLang,
    sourceLang: settings.sourceLang,
    lastDownloadFormat: settings.lastDownloadFormat,
  };
}

export async function saveSettings(partial: Partial<Settings>): Promise<void> {
  const payload: Record<string, string> = {};

  if (partial.apiKey !== undefined) {
    payload[STORAGE_KEYS.apiKey] = partial.apiKey;
  }
  if (partial.defaultTargetLang !== undefined) {
    payload[STORAGE_KEYS.defaultTargetLang] = partial.defaultTargetLang;
  }
  if (partial.sourceLang !== undefined) {
    payload[STORAGE_KEYS.sourceLang] = partial.sourceLang;
  }
  if (partial.lastDownloadFormat !== undefined) {
    payload[STORAGE_KEYS.lastDownloadFormat] = partial.lastDownloadFormat;
  }

  if (Object.keys(payload).length > 0) {
    await chrome.storage.local.set(payload);
  }
}

export async function clearSettings(): Promise<void> {
  await chrome.storage.local.remove(Object.values(STORAGE_KEYS));
}
