import { encoding_for_model } from "tiktoken";
import { type Message, type SystemMessage, type UserMessage } from "./types.ts";

const MODEL_NAME = Deno.env.get("OPENAI_MODEL_NAME")!;

/**
 * Generate messages
 *
 * @param systemMessage system prompt
 * @param content content
 * @param image base64 encoded image data
 * @returns list of messages
 */
export function generateMessages(
  systemMessage: SystemMessage,
  content: string,
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
          text: content,
        },
      ]
      : content,
  };

  const messages = [systemMessage, userMessage];

  return messages;
}

/**
 * Count tokens
 */
export function countTokens(str: string): number {
  const encoding = encoding_for_model(MODEL_NAME);
  const tokens = encoding.encode(str);
  encoding.free();
  return tokens.length;
}

/**
 * Count tokens for image
 *
 * from https://platform.openai.com/docs/guides/vision/calculating-costs
 *
 * @param width integer width of image in pixels
 * @param height integer height of image in pixels
 * @param detailMode low or high detail mode
 * @returns number of tokens
 */
export function countTokensImage(
  width: number,
  height: number,
  detailMode: "low" | "high",
): number {
  // 85 tokens always
  const tokensDefault = 85;

  // default tokens only
  if (detailMode == "low") {
    return tokensDefault;
  }

  let longerSide = Math.max(width, height);
  let shorterSide = Math.min(width, height);

  // scale down such that longer side is max. 2048px
  if (longerSide > 2048) {
    const scaleFactor = 2048 / longerSide;
    // todo: increase scaleFactor such that shorter side is integer? Or maybe just round shorter side down?
    shorterSide *= scaleFactor;
    longerSide *= scaleFactor;
  }

  // scale down such that shorter side is max. 768px
  if (shorterSide > 768) {
    const scaleFactor = 768 / shorterSide;
    shorterSide *= scaleFactor;
    // todo: increase scaleFactor such that longer side is integer? Or maybe just round longer side down?
    longerSide *= scaleFactor;
  }

  // count number of 512px square tiles
  const tilesShort = Math.ceil(shorterSide / 512);
  const tilesLong = Math.ceil(longerSide / 512);
  const totalTiles = tilesShort * tilesLong;

  // 170 tokens for each tile plus default tokens
  const tokens = totalTiles * 170 + tokensDefault;

  return tokens;
}
