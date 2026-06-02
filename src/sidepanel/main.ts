import type {
  ExportFormat,
  PublicSettings,
  SessionStateResponse,
  TranslationDoc,
  TranslateErrorPayload,
  TranslateProgressPayload,
  TranslateSuccessPayload,
} from '../shared/types';
import { MessageType, SUPPORTED_LANGUAGES } from '../shared/constants';
import {
  downloadBlob,
  downloadText,
  getActiveTabId,
  sendMessage,
} from '../shared/utils/messaging';
import { getLanguageLabel } from '../shared/utils/language';
import { exportMarkdown } from './export/markdown';
import { exportPdf } from './export/pdf';

const openSettingsBtn = document.getElementById('open-settings') as HTMLButtonElement;
const bannerSettingsBtn = document.getElementById('banner-settings') as HTMLButtonElement;
const keyBanner = document.getElementById('key-banner') as HTMLDivElement;
const targetLangSelect = document.getElementById('target-lang') as HTMLSelectElement;
const translateBtn = document.getElementById('translate-btn') as HTMLButtonElement;
const statusText = document.getElementById('status-text') as HTMLParagraphElement;
const progressBar = document.getElementById('progress-bar') as HTMLDivElement;
const progressFill = document.getElementById('progress-fill') as HTMLDivElement;
const translationPanel = document.getElementById('translation-panel') as HTMLElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
const formatInputs = document.querySelectorAll<HTMLInputElement>('input[name="format"]');

let currentTabId = 0;
let currentDoc: TranslationDoc | null = null;
let settings: PublicSettings | null = null;

function openSettings(): void {
  void chrome.runtime.openOptionsPage();
}

function populateLanguageSelect(): void {
  targetLangSelect.innerHTML = SUPPORTED_LANGUAGES.filter((lang) => lang.code !== 'auto')
    .map(
      (lang) =>
        `<option value="${lang.code}">${lang.label}</option>`,
    )
    .join('');
}

function getSelectedFormat(): ExportFormat {
  const checked = document.querySelector<HTMLInputElement>('input[name="format"]:checked');
  return checked?.value === 'pdf' ? 'pdf' : 'markdown';
}

function setFormat(format: ExportFormat): void {
  formatInputs.forEach((input) => {
    input.checked = input.value === format;
  });
}

function renderTranslationDoc(doc: TranslationDoc): void {
  translationPanel.innerHTML = '';

  const meta = document.createElement('p');
  meta.className = 'meta-text';
  meta.textContent = `${getLanguageLabel(doc.targetLang)} · ${new Date(doc.translatedAt).toLocaleString()}`;
  translationPanel.appendChild(meta);

  for (const block of doc.blocks) {
    let element: HTMLElement;

    switch (block.type) {
      case 'heading': {
        const level = Math.min(Math.max(block.level ?? 1, 1), 6);
        element = document.createElement(`h${level}`);
        element.textContent = block.text ?? '';
        break;
      }
      case 'list': {
        element = document.createElement('ul');
        for (const item of block.items ?? []) {
          const li = document.createElement('li');
          li.textContent = item;
          element.appendChild(li);
        }
        break;
      }
      case 'blockquote': {
        element = document.createElement('blockquote');
        element.textContent = block.text ?? '';
        break;
      }
      case 'code': {
        element = document.createElement('pre');
        element.textContent = block.text ?? '';
        break;
      }
      case 'image': {
        element = document.createElement('figure');
        element.className = 'article-image';

        const img = document.createElement('img');
        img.src = block.src ?? '';
        img.alt = block.alt ?? '';
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        element.appendChild(img);

        if (block.caption) {
          const caption = document.createElement('figcaption');
          caption.textContent = block.caption;
          element.appendChild(caption);
        }
        break;
      }
      default: {
        element = document.createElement('p');
        element.textContent = block.text ?? '';
      }
    }

    translationPanel.appendChild(element);
  }
}

function setBusy(isBusy: boolean, message?: string): void {
  translateBtn.disabled = isBusy;
  if (message) {
    statusText.textContent = message;
  }
}

function showProgress(current: number, total: number): void {
  progressBar.classList.remove('hidden');
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  progressFill.style.width = `${percent}%`;
  statusText.textContent = `翻译中 ${percent}%（${current}/${total}）`;
}

function hideProgress(): void {
  progressBar.classList.add('hidden');
  progressFill.style.width = '0';
}

function applySessionState(state: SessionStateResponse): void {
  hideProgress();

  if (state.jobState === 'translating') {
    setBusy(true);
    if (state.progress) {
      showProgress(state.progress.current, state.progress.total);
    } else {
      statusText.textContent = '翻译中…';
    }
    downloadBtn.disabled = true;
    return;
  }

  if (state.jobState === 'extracting') {
    setBusy(true, '正在提取正文…');
    downloadBtn.disabled = true;
    return;
  }

  if (state.jobState === 'done' && state.translationDoc) {
    currentDoc = state.translationDoc;
    renderTranslationDoc(state.translationDoc);
    setBusy(false, '翻译完成');
    downloadBtn.disabled = false;
    return;
  }

  if (state.jobState === 'error' && state.error) {
    setBusy(false);
    statusText.textContent = state.error.message;
    statusText.classList.add('error-text');
    downloadBtn.disabled = true;
    return;
  }

  setBusy(false, '选择文章页后点击翻译');
  statusText.classList.remove('error-text');
  downloadBtn.disabled = !currentDoc;
}

async function loadSettings(): Promise<void> {
  const response = await sendMessage<undefined, PublicSettings>({
    type: MessageType.GET_SETTINGS,
  });
  if (!response.ok || !response.data) {
    return;
  }

  settings = response.data;
  targetLangSelect.value = settings.defaultTargetLang;
  if (settings.lastDownloadFormat) {
    setFormat(settings.lastDownloadFormat);
  }

  if (!settings.hasApiKey) {
    keyBanner.classList.remove('hidden');
    translateBtn.disabled = true;
  } else {
    keyBanner.classList.add('hidden');
    translateBtn.disabled = false;
  }
}

async function refreshSessionState(): Promise<void> {
  const response = await sendMessage<{ tabId: number }, SessionStateResponse>({
    type: MessageType.GET_SESSION_STATE,
    payload: { tabId: currentTabId },
  });

  if (response.ok && response.data) {
    applySessionState(response.data);
    if (response.data.translationDoc) {
      currentDoc = response.data.translationDoc;
    }
  }
}

async function startTranslate(): Promise<void> {
  if (!settings?.hasApiKey) {
    openSettings();
    return;
  }

  statusText.classList.remove('error-text');
  setBusy(true, '正在提取正文…');
  downloadBtn.disabled = true;
  translationPanel.innerHTML = '<p class="empty-state">翻译进行中…</p>';

  const response = await sendMessage<
    { tabId: number; targetLang: string; sourceLang?: string },
    { started: boolean }
  >({
    type: MessageType.TRANSLATE_START,
    payload: {
      tabId: currentTabId,
      targetLang: targetLangSelect.value,
      sourceLang: settings.sourceLang,
    },
  });

  if (!response.ok) {
    setBusy(false);
    statusText.textContent = response.error?.message ?? '翻译启动失败';
    statusText.classList.add('error-text');
  }
}

async function downloadTranslation(): Promise<void> {
  if (!currentDoc) {
    return;
  }

  const format = getSelectedFormat();
  downloadBtn.disabled = true;
  statusText.textContent = '正在生成文件…';

  try {
    if (format === 'markdown') {
      const { content, filename } = exportMarkdown(currentDoc);
      downloadText(content, filename, 'text/markdown;charset=utf-8');
    } else {
      const { blob, filename } = await exportPdf(currentDoc);
      downloadBlob(blob, filename);
    }

    await sendMessage({
      type: MessageType.SAVE_SETTINGS,
      payload: { lastDownloadFormat: format },
    });

    statusText.textContent = '下载已开始';
  } catch (error) {
    const message = error instanceof Error ? error.message : '下载失败';
    statusText.textContent = message;
    statusText.classList.add('error-text');
  } finally {
    downloadBtn.disabled = false;
  }
}

function setupListeners(): void {
  openSettingsBtn.addEventListener('click', openSettings);
  bannerSettingsBtn.addEventListener('click', openSettings);
  translateBtn.addEventListener('click', () => void startTranslate());
  downloadBtn.addEventListener('click', () => void downloadTranslation());

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === MessageType.TRANSLATE_PROGRESS) {
      const payload = message.payload as TranslateProgressPayload;
      if (payload.tabId !== currentTabId) {
        return;
      }
      showProgress(payload.current, payload.total);
      return;
    }

    if (message.type === MessageType.TRANSLATE_SUCCESS) {
      const payload = message.payload as TranslateSuccessPayload;
      if (payload.tabId !== currentTabId) {
        return;
      }
      currentDoc = payload.translationDoc;
      applySessionState({ jobState: 'done', translationDoc: payload.translationDoc });
      return;
    }

    if (message.type === MessageType.TRANSLATE_ERROR) {
      const payload = message.payload as TranslateErrorPayload;
      if (payload.tabId !== currentTabId) {
        return;
      }
      applySessionState({
        jobState: 'error',
        error: { code: payload.code, message: payload.message },
      });
    }
  });
}

async function init(): Promise<void> {
  populateLanguageSelect();
  setupListeners();
  currentTabId = await getActiveTabId();
  await loadSettings();
  await refreshSessionState();
}

void init();
