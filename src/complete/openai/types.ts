// adapted from https://platform.openai.com/docs/api-reference/chat/create

export interface Chat {
  messages: Message[];
}

export type Message = SystemMessage | UserMessage | AssistantMessage;

export interface SystemMessage {
  role: "system";
  content: Content;
  name?: string;
}

export interface UserMessage {
  role: "user";
  content: Content;
  name?: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: Content;
  name?: string;
}

/**
 * The contents of the user message.
 */
export type Content = string | (TextContent | ImageContent)[];

/**
 * Text content part
 */
export interface TextContent {
  // todo: is correct? https://platform.openai.com/docs/api-reference/chat/create only says string
  /**
   * The type of the content part.
   */
  type: "text";
  /**
   * The text content.
   */
  text: string;
}

/**
 * Image content part
 */
export interface ImageContent {
  /**
   * The type of the content part.
   */
  type: "image_url";
  image_url: ImageUrl;
}

export interface ImageUrl {
  /**
   * Either a URL of the image or the base64 encoded image data.
   */
  url: string;
  /**
   * Specifies the detail level of the image.
   * Defaults to `"auto"`.
   */
  detail?: "low" | "high" | "auto";
}
