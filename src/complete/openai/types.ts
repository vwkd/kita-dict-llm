export interface MessageOpenAI {
  role: "system" | "user" | "assistant";
  content: string;
}
