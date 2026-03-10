type OpenAIMessage = {
  role: "system" | "user";
  content: string;
};

type OpenAIOptions = {
  temperature?: number;
  maxTokens?: number;
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function getModel() {
  return process.env.OPENAI_MODEL || "gpt-4o";
}

export async function callOpenAIText(
  messages: OpenAIMessage[],
  options: OpenAIOptions = {}
) {
  const apiKey = requireEnv("OPENAI_API_KEY");

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
      temperature: options.temperature ?? 0.6,
      max_tokens: options.maxTokens ?? 800,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenAI response missing content");
  }

  return content.trim();
}

function extractJsonCandidate(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

export async function callOpenAIJson<T>(
  messages: OpenAIMessage[],
  options: OpenAIOptions = {}
): Promise<T> {
  const text = await callOpenAIText(messages, options);
  const candidate = extractJsonCandidate(text);

  try {
    return JSON.parse(candidate) as T;
  } catch (error) {
    throw new Error("OpenAI returned invalid JSON");
  }
}
