import { Configuration, OpenAIApi } from "npm:openai"

const configuration = new Configuration({
    organization: Deno.env.get("OPENAI_ORGANIZATION"),
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const openai = new OpenAIApi(configuration);
const response = await openai.listEngines();

console.log(response);