import { SUPPORTED_LANGUAGES } from '../constants';

export function getLanguageLabel(code: string): string {
  const found = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
  return found?.label ?? code;
}

export function normalizeLangCode(code: string): string {
  return code.trim().toLowerCase();
}

export function getLanguageNameForPrompt(code: string): string {
  if (code === 'auto') {
    return '自动检测（保持原文语言风格翻译为目标语言）';
  }
  return getLanguageLabel(code);
}
