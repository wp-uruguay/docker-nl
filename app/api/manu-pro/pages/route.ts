import { NextResponse } from "next/server";
import { callOpenAIJson } from "@/lib/manu-pro/openai";
import { callGeminiJson } from "@/lib/manu-pro/gemini";

export const runtime = "nodejs";

type ReqBody = {
  brandName?: string;
  description?: string;
  provider?: "openai" | "gemini";
};

type PagesResponse = {
  pages: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;

    const provider = body?.provider || "openai";

    const system =
      "You are a web strategist. Return JSON only. Avoid accents if possible.";

    const user = `Suggest a website page structure (4 to 7 pages) for this business.
Brand name: ${body?.brandName || "Unknown"}
Description: ${body?.description || "No details"}
Return JSON exactly like: {"pages":["Inicio","Servicios","Nosotros","Contacto"]}`;

    const data =
      provider === "gemini"
        ? await callGeminiJson<PagesResponse>(`${system}\n\n${user}`)
        : await callOpenAIJson<PagesResponse>([
            { role: "system", content: system },
            { role: "user", content: user },
          ]);

    const pages = Array.isArray(data?.pages) ? data.pages : [];
    if (pages.length === 0) {
      return NextResponse.json({ error: "No pages generated" }, { status: 502 });
    }

    return NextResponse.json({ pages: pages.slice(0, 7) });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "server_error" },
      { status: 500 }
    );
  }
}
