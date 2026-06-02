import type { RuntimeMessage, RuntimeResponse } from '../shared/types';

type MessageHandler = (
  payload: unknown,
  sender: chrome.runtime.MessageSender,
) => Promise<RuntimeResponse> | RuntimeResponse;

const handlers = new Map<string, MessageHandler>();

export function registerHandler(type: string, handler: MessageHandler): void {
  handlers.set(type, handler);
}

export async function dispatch(
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender,
): Promise<RuntimeResponse> {
  const handler = handlers.get(message.type);
  if (!handler) {
    return {
      ok: false,
      error: { code: 'UNKNOWN', message: `未知消息类型: ${message.type}` },
    };
  }

  try {
    return await handler(message.payload, sender);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      ok: false,
      error: { code: 'UNKNOWN', message: err.message },
    };
  }
}
