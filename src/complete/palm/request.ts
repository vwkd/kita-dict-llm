import { TextServiceClient } from "generativelanguage";
import { GoogleAuth } from "google-auth-library";

const PALM_API_KEY = Deno.env.get("PALM_API_KEY")!;
const MODEL_NAME = Deno.env.get("PALM_MODEL_NAME")!;

/**
 * Makes request to PaLM API
 */
// todo:
export async function makeRequest(
  message: string,
) {
  const client = new TextServiceClient({
    authClient: new GoogleAuth().fromAPIKey(PALM_API_KEY),
  });

  try {
    const response = await client.generateText({
      // maxOutputTokens: 1024,
      model: MODEL_NAME,
      prompt: {
        text: message,
      },
    });

    return response;
  } catch (e) {
    console.error(e);
  }
}
