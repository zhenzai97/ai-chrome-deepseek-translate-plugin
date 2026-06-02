export type ContentBlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'blockquote'
  | 'code'
  | 'image';

export interface ContentBlock {
  type: ContentBlockType;
  level?: number;
  text?: string;
  items?: string[];
  /** 图片绝对 URL（image 块必填，翻译时原样保留） */
  src?: string;
  alt?: string;
  caption?: string;
  title?: string;
}

export interface ArticlePayload {
  url: string;
  title: string;
  byline?: string;
  langHint?: string;
  blocks: ContentBlock[];
  plainText: string;
}

export interface TranslatedBlock extends ContentBlock {}

export interface TranslationDoc {
  titleTranslated: string;
  blocks: TranslatedBlock[];
  targetLang: string;
  translatedAt: string;
  sourceUrl?: string;
}

export type JobState =
  | 'idle'
  | 'extracting'
  | 'translating'
  | 'done'
  | 'error';

export type ExportFormat = 'markdown' | 'pdf';

export interface Settings {
  apiKey?: string;
  defaultTargetLang: string;
  sourceLang: string;
  lastDownloadFormat?: ExportFormat;
}

export interface PublicSettings {
  hasApiKey: boolean;
  maskedApiKey?: string;
  defaultTargetLang: string;
  sourceLang: string;
  lastDownloadFormat?: ExportFormat;
}

export interface TabSession {
  tabId: number;
  pageUrl: string;
  jobState: JobState;
  progress?: { current: number; total: number };
  error?: { code: string; message: string };
  translationDoc?: TranslationDoc;
  extractedArticle?: ArticlePayload;
}

export interface TranslateStartPayload {
  tabId: number;
  targetLang: string;
  sourceLang?: string;
}

export interface TranslateProgressPayload {
  tabId: number;
  current: number;
  total: number;
}

export interface TranslateSuccessPayload {
  tabId: number;
  translationDoc: TranslationDoc;
}

export interface TranslateErrorPayload {
  tabId: number;
  code: string;
  message: string;
}

export interface GetSessionStatePayload {
  tabId: number;
}

export interface SessionStateResponse {
  jobState: JobState;
  progress?: { current: number; total: number };
  error?: { code: string; message: string };
  translationDoc?: TranslationDoc;
  pageUrl?: string;
}

export interface SaveSettingsPayload {
  apiKey?: string;
  defaultTargetLang?: string;
  sourceLang?: string;
  lastDownloadFormat?: ExportFormat;
}

export interface RuntimeMessage<T = unknown> {
  type: string;
  payload?: T;
}

export interface RuntimeResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface ChunkPlan {
  index: number;
  blocks: ContentBlock[];
  text: string;
}
