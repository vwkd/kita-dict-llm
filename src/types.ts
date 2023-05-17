export interface Data {
  page: string;
  before: string;
  after: string;
}

export interface MessageOpenAI {
  role: "system" | "user" | "assistant";
  content: string;
}
