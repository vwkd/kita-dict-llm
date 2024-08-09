import {
  type AssistantMessage,
  type Chat,
  type SystemMessage,
  type UserMessage,
} from "../../complete/openai/types.ts";

/**
 * Generate chat
 *
 * @param systemPrompt system prompt
 * @param contentBefore content before
 * @param contentAfter content after
 * @returns chat
 */
export function generateChat(
  systemPrompt: SystemMessage,
  contentBefore: string,
  contentAfter: string,
): Chat {
  const userMessage: UserMessage = {
    role: "user",
    content: contentBefore,
  };

  const assistantMessage: AssistantMessage = {
    role: "assistant",
    content: contentAfter,
  };

  const messages = [systemPrompt, userMessage, assistantMessage];

  return {
    messages,
  };
}
