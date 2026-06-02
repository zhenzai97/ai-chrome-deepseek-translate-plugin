import type { PublicSettings } from '../shared/types';
import { MessageType, SUPPORTED_LANGUAGES } from '../shared/constants';
import { sendMessage } from '../shared/utils/messaging';

const form = document.getElementById('settings-form') as HTMLFormElement;
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const maskedKeyHint = document.getElementById('masked-key') as HTMLElement;
const defaultTargetLangSelect = document.getElementById('default-target-lang') as HTMLSelectElement;
const sourceLangSelect = document.getElementById('source-lang') as HTMLSelectElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLParagraphElement;

function populateSelects(): void {
  const targetOptions = SUPPORTED_LANGUAGES.filter((lang) => lang.code !== 'auto')
    .map((lang) => `<option value="${lang.code}">${lang.label}</option>`)
    .join('');

  const sourceOptions = SUPPORTED_LANGUAGES.map(
    (lang) => `<option value="${lang.code}">${lang.label}</option>`,
  ).join('');

  defaultTargetLangSelect.innerHTML = targetOptions;
  sourceLangSelect.innerHTML = sourceOptions;
}

function setStatus(message: string, isError = false): void {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

async function loadSettings(): Promise<void> {
  const response = await sendMessage<undefined, PublicSettings>({
    type: MessageType.GET_SETTINGS,
  });

  if (!response.ok || !response.data) {
    setStatus('加载设置失败', true);
    return;
  }

  const settings = response.data;
  defaultTargetLangSelect.value = settings.defaultTargetLang;
  sourceLangSelect.value = settings.sourceLang;
  maskedKeyHint.textContent = settings.maskedApiKey
    ? `当前已配置：${settings.maskedApiKey}（留空则不修改）`
    : '尚未配置 API Key';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const payload: {
    apiKey?: string;
    defaultTargetLang: string;
    sourceLang: string;
  } = {
    defaultTargetLang: defaultTargetLangSelect.value,
    sourceLang: sourceLangSelect.value,
  };

  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    payload.apiKey = apiKey;
  }

  void sendMessage({
    type: MessageType.SAVE_SETTINGS,
    payload,
  }).then((response) => {
    if (!response.ok) {
      setStatus(response.error?.message ?? '保存失败', true);
      return;
    }

    apiKeyInput.value = '';
    setStatus('设置已保存');
    void loadSettings();
  });
});

clearBtn.addEventListener('click', () => {
  void sendMessage({ type: MessageType.CLEAR_SETTINGS }).then((response) => {
    if (!response.ok) {
      setStatus(response.error?.message ?? '清除失败', true);
      return;
    }

    apiKeyInput.value = '';
    setStatus('配置已清除');
    void loadSettings();
  });
});

populateSelects();
void loadSettings();
