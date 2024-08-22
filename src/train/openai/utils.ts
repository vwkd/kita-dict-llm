import { join } from "@std/path";
import { countTokens, countTokensImage } from "../../complete/openai/utils.ts";
import {
  type AssistantMessage,
  type Message,
  type SystemMessage,
  type UserMessage,
} from "../../complete/openai/types.ts";
import { type ImageMetadata } from "./types.ts";

/**
 * Generate messages
 *
 * @param systemMessage system prompt
 * @param contentBefore content before
 * @param contentAfter content after
 * @param image base64 encoded image data
 * @returns list of messages
 */
export function generateMessages(
  systemMessage: SystemMessage,
  contentBefore: string,
  contentAfter: string,
  image?: string,
): Message[] {
  const userMessage: UserMessage = {
    role: "user",
    content: image
      ? [
        {
          type: "image_url",
          image_url: {
            url: image,
            detail: "high",
          },
        },
        {
          type: "text",
          text: contentBefore,
        },
      ]
      : contentBefore,
  };

  const assistantMessage: AssistantMessage = {
    role: "assistant",
    content: contentAfter,
  };

  const messages = [systemMessage, userMessage, assistantMessage];

  return messages;
}

/**
 * Get image as base64 encoded image data
 *
 * @param dictRepo dictionary repository path
 * @param pageNumber page number, e.g. `1/123`
 * @returns base64 encoded image data
 */
export async function getImage(
  dictRepo: string,
  pageNumber: string,
): Promise<string> {
  const [partNumber, pageNumberShort] = pageNumber.split("/");
  const filepath = join(
    dictRepo,
    `tmp/part${partNumber}/page-${pageNumberShort}_cropped.jpg`,
  );

  const image = await Deno.readFile(filepath);
  const base64 = await bytesToBase64DataUrl(image, "image/jpeg");

  return base64;
}

/**
 * Convert bytes to base64 data url
 *
 * @param bytes array of bytes, e.g. `new Uint8Array([1,2,3])`
 * @param type MIME type, defaults to `application/octet-stream`, e.g. `image/jpeg`
 * @returns base64 data url, e.g. `data:application/octet-stream;base64,AQID`
 */
export async function bytesToBase64DataUrl(
  bytes: Uint8Array,
  type?: string,
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = Object.assign(new FileReader(), {
      onload: () => resolve(reader.result),
      onerror: () => reject(reader.error),
    });
    reader.readAsDataURL(new File([bytes], "", { type }));
  });
}

/**
 * Get width and height of image
 *
 * @param metadata image metadata
 * @param pageNumber page number, e.g. `1/123`
 * @returns width and height
 */
export function getWidthHeight(
  metadata: ImageMetadata[],
  pageNumber: string,
): { width: number; height: number } {
  const [partNumber, pageNumberShort] = pageNumber.split("/");

  const { width, height } = metadata.find((m) =>
    m.partNumber == partNumber && m.pageNumber == pageNumberShort
  )!;

  // todo: verify that is safe
  return { width: Number.parseInt(width), height: Number.parseInt(height) };
}

/**
 * Get token count for messages
 *
 * @param messages messages
 * @param metadata image metadata
 * @param pageNumber page number, e.g. `1/123`
 * @returns number of tokens of messages
 */
export function getTokenCount(
  messages: Message[],
  metadata: ImageMetadata[],
  pageNumber: string,
): number {
  let tokenCount = 0;

  for (const { content } of messages) {
    if (typeof content == "string") {
      tokenCount += countTokens(content);
    } else if (Array.isArray(content)) {
      for (const m of content) {
        if (m.type == "text") {
          tokenCount += countTokens(m.text);
        } else if (m.type == "image_url") {
          const { width, height } = getWidthHeight(metadata, pageNumber);
          tokenCount += countTokensImage(width, height, "high");
        } else {
          throw new Error(`Unexpected array content ${m}`);
        }
      }
    } else {
      throw new Error(`Unexpected content ${content}`);
    }
  }

  return tokenCount;
}
