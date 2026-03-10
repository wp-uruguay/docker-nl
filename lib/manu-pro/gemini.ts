import { GoogleGenAI } from "@google/genai";

type GeminiOptions = {
  temperature?: number;
  maxTokens?: number;
  model?: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function getModel() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

function extractText(resp: any): string {
  if (!resp) return "";
  if (typeof resp.text === "string") return resp.text;
  if (typeof resp.text === "function") return resp.text();
  const c0 = resp.candidates?.[0];
  const parts = c0?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((p: any) => p?.text ?? "").join("");
  }
  return "";
}

function extractJsonCandidate(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

export async function callGeminiText(
  prompt: string,
  options: GeminiOptions = {}
) {
  const apiKey = requireEnv("GOOGLE_API_KEY");
  const ai = new GoogleGenAI({ apiKey });

  const resp = await ai.models.generateContent({
    model: options.model || getModel(),
    contents: prompt,
    config: {
      temperature: options.temperature ?? 0.6,
      maxOutputTokens: options.maxTokens ?? 900,
    },
  });

  const text = extractText(resp).trim();
  if (!text) {
    throw new Error("Gemini response empty");
  }

  return text;
}

export async function callGeminiJson<T>(
  prompt: string,
  options: GeminiOptions = {}
): Promise<T> {
  const text = await callGeminiText(prompt, options);
  const candidate = extractJsonCandidate(text);
  try {
    return JSON.parse(candidate) as T;
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }
}
