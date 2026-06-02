import { DEEPSEEK_CONFIG, ErrorCode, type ErrorCodeValue } from '../constants';
import { ERROR_MESSAGES } from '../constants';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ChatCompletionResult {
  content: string;
}

export class DeepSeekError extends Error {
  code: ErrorCodeValue;

  constructor(code: ErrorCodeValue, message?: string) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = 'DeepSeekError';
    this.code = code;
  }
}

export function mapApiError(status: number): ErrorCodeValue {
  if (status === 401) {
    return ErrorCode.AUTH_INVALID;
  }
  if (status === 402 || status === 429) {
    return ErrorCode.QUOTA_EXCEEDED;
  }
  if (status >= 500) {
    return ErrorCode.NETWORK_ERROR;
  }
  return ErrorCode.UNKNOWN;
}

export async function chatCompletion(
  apiKey: string,
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<ChatCompletionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    DEEPSEEK_CONFIG.requestTimeoutMs,
  );

  const signal = options.signal ?? controller.signal;
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(DEEPSEEK_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_CONFIG.model,
        messages,
        temperature: options.temperature ?? DEEPSEEK_CONFIG.temperature,
        max_tokens: options.maxTokens ?? 4096,
        stream: false,
      }),
      signal,
    });

    if (!response.ok) {
      throw new DeepSeekError(mapApiError(response.status));
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new DeepSeekError(ErrorCode.UNKNOWN, '翻译结果为空');
    }

    return { content };
  } catch (error) {
    if (error instanceof DeepSeekError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new DeepSeekError(ErrorCode.TIMEOUT);
    }
    throw new DeepSeekError(ErrorCode.NETWORK_ERROR);
  } finally {
    clearTimeout(timeout);
  }
}
