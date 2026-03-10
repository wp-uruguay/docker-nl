import { NextResponse } from "next/server";
import { callOpenAIJson } from "@/lib/manu-pro/openai";
import { callGeminiJson } from "@/lib/manu-pro/gemini";

export const runtime = "nodejs";

type ReqBody = {
  businessType?: "established" | "new";
  hint?: string;
  provider?: "openai" | "gemini";
};

type NameResponse = {
  names: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;
    const businessType = body?.businessType || "new";
    const hint = body?.hint?.trim();
    const provider = body?.provider || "openai";

    const system =
      "You are a branding assistant. Return JSON only. Avoid accents if possible.";

    const user = `Generate 5 short, brandable business names in Spanish for a ${
      businessType === "established" ? "established business" : "new project"
    }.
${hint ? `Context: ${hint}` : "Context: no details provided."}
Return JSON exactly like: {"names":["Name 1","Name 2","Name 3","Name 4","Name 5"]}`;

    const data =
      provider === "gemini"
        ? await callGeminiJson<NameResponse>(`${system}\n\n${user}`)
        : await callOpenAIJson<NameResponse>([
            { role: "system", content: system },
            { role: "user", content: user },
          ]);

    const names = Array.isArray(data?.names) ? data.names.slice(0, 5) : [];
    if (names.length === 0) {
      return NextResponse.json({ error: "No names generated" }, { status: 502 });
    }

    return NextResponse.json({ names });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "server_error" },
      { status: 500 }
    );
  }
}
