import { NextResponse } from "next/server";
import { callOpenAIText } from "@/lib/manu-pro/openai";
import { callGeminiText } from "@/lib/manu-pro/gemini";

export const runtime = "nodejs";

type ReqBody = {
  brandName: string;
  description?: string;
  colors: string[];
  style: string;
  provider?: "openai" | "gemini";
};

function extractSvg(text: string) {
  const start = text.indexOf("<svg");
  const end = text.lastIndexOf("</svg>");
  if (start === -1 || end === -1) return null;
  return text.slice(start, end + 6);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;
    if (!body?.brandName || !body?.style) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const system =
      "You are a logo designer. Return only SVG markup, no markdown, no comments.";

    const user = `Create a simple, clean SVG logo for this brand.
Brand name: ${body.brandName}
Style: ${body.style}
Colors: ${(body.colors || []).join(", ")}
Description: ${body.description || "No details"}
SVG requirements:
- Use a logo aspect ratio (square or horizontal)
- Prefer transparent background (no background rect)
- Use viewBox and responsive SVG sizing
- Include brand name text
- Use 1-3 colors from the palette
- Keep it minimal and readable
Return ONLY the SVG element.`;

    const text = await callGeminiText(`${system}\n\n${user}`, {
      maxTokens: 1200,
      temperature: 0.7,
      model: "nanobanana",
    });

    const svg = extractSvg(text);
    if (!svg) {
      return NextResponse.json({ error: "No SVG returned" }, { status: 502 });
    }

    const encoded = encodeURIComponent(svg)
      .replace(/'/g, "%27")
      .replace(/"/g, "%22");
    const dataUrl = `data:image/svg+xml;utf8,${encoded}`;

    return NextResponse.json({ svg, dataUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "server_error" },
      { status: 500 }
    );
  }
}
