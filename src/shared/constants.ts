export const MessageType = {
  EXTRACT_ARTICLE: 'EXTRACT_ARTICLE',
  TRANSLATE_START: 'TRANSLATE_START',
  TRANSLATE_PROGRESS: 'TRANSLATE_PROGRESS',
  TRANSLATE_SUCCESS: 'TRANSLATE_SUCCESS',
  TRANSLATE_ERROR: 'TRANSLATE_ERROR',
  GET_SESSION_STATE: 'GET_SESSION_STATE',
  GET_SETTINGS: 'GET_SETTINGS',
  SAVE_SETTINGS: 'SAVE_SETTINGS',
  CLEAR_SETTINGS: 'CLEAR_SETTINGS',
} as const;

export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType];

export const ErrorCode = {
  AUTH_INVALID: 'AUTH_INVALID',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  NO_CONTENT: 'NO_CONTENT',
  BUSY: 'BUSY',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ERROR_MESSAGES: Record<ErrorCodeValue, string> = {
  AUTH_INVALID: 'API Key 无效，请检查设置',
  QUOTA_EXCEEDED: '配额不足或请求过于频繁',
  NETWORK_ERROR: '网络异常，请稍后重试',
  TIMEOUT: '翻译超时，可重试',
  NO_CONTENT: '无法识别文章内容',
  BUSY: '翻译进行中，请稍候',
  UNKNOWN: '翻译失败，请重试',
};

export const DEFAULT_SETTINGS = {
  defaultTargetLang: 'zh-CN',
  sourceLang: 'auto',
  lastDownloadFormat: 'markdown' as const,
};

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', label: '自动检测' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁体中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
] as const;

export const DEEPSEEK_CONFIG = {
  baseUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  temperature: 0.3,
  requestTimeoutMs: 60_000,
  maxCharsPerChunk: 7000,
};

export const BLOCK_SEPARATOR = '\n---BLOCK---\n';
