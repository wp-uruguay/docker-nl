import { NextResponse } from "next/server";
import { callOpenAIJson } from "@/lib/manu-pro/openai";
import { callGeminiJson } from "@/lib/manu-pro/gemini";

export const runtime = "nodejs";

type ReqBody = {
  brandName?: string;
  description?: string;
  provider?: "openai" | "gemini";
};

type ColorResponse = {
  colors: string[];
};

function normalizeHex(input: string) {
  const value = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toUpperCase();
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;

    const provider = body?.provider || "openai";

    const system =
      "You are a branding assistant. Return JSON only. Use HEX colors.";

    const user = `Suggest 3 brand colors in HEX format for this brand.
Brand name: ${body?.brandName || "Unknown"}
Description: ${body?.description || "No details"}
Return JSON exactly like: {"colors":["#112233","#AABBCC","#FF9900"]}`;

    const data =
      provider === "gemini"
        ? await callGeminiJson<ColorResponse>(`${system}\n\n${user}`)
        : await callOpenAIJson<ColorResponse>([
            { role: "system", content: system },
            { role: "user", content: user },
          ]);

    const normalized = (data?.colors || [])
      .map((c) => (typeof c === "string" ? normalizeHex(c) : null))
      .filter(Boolean) as string[];

    if (normalized.length === 0) {
      return NextResponse.json({ error: "No colors generated" }, { status: 502 });
    }

    return NextResponse.json({ colors: normalized.slice(0, 3) });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "server_error" },
      { status: 500 }
    );
  }
}
