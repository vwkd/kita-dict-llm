// adapted from https://platform.openai.com/docs/api-reference/chat/create

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

/**
 * The per-line object of the batch input file
 */
export interface RequestItem {
  /**
   * A developer-provided per-request id that will be used to match outputs to inputs. Must be unique for each request in a batch.
   */
  custom_id: string;
  /**
   * The HTTP method to be used for the request.
   */
  method: "POST";
  /**
   * The OpenAI API relative URL to be used for the request.
   */
  url: "/v1/chat/completions";
  /**
   * The body of the request
   */
  body: unknown;
}

/**
 * The per-line object of the batch output and error files
 */
export interface ResponseItem {
  /**
   * The ID of the response
   */
  id: string;
  /**
   * A developer-provided per-request id that will be used to match outputs to inputs.
   */
  custom_id: string;
  /**
   * The details of the response
   */
  response: ResponseItemDetails | null;
}

/**
 * Details of response
 */
interface ResponseItemDetails {
  /**
   * The HTTP status code of the response
   */
  status_code: number;
  /**
   * An unique identifier for the OpenAI API request. Please include this request ID when contacting support.
   */
  request_id: string;
  /**
   * The body of the response
   */
  body: unknown;
  /**
   * For requests that failed with a non-HTTP error, this will contain more information on the cause of the failure.
   */
  error: ResponseError | null;
}

/**
 * Error of response
 */
export interface ResponseError {
  /**
   * A machine-readable error code.
   */
  code: string;
  /**
   * A human-readable error message.
   */
  message: string;
}
