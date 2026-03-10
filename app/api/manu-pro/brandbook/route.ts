import { NextResponse } from "next/server";
import { callOpenAIJson } from "@/lib/manu-pro/openai";
import { callGeminiJson } from "@/lib/manu-pro/gemini";

export const runtime = "nodejs";

type ReqBody = {
  conversationId?: string;
  projectName: string;
  businessType?: string;
  description: string;
  colors: string[];
  provider?: "openai" | "gemini";
  logo?: {
    source?: "uploaded" | "generated";
    dataUrl?: string | null;
  };
  favicon?: {
    dataUrl?: string | null;
  };
  logoStyle?: string | null;
  pages?: string[];
  subdomain?: string | null;
  user?: {
    id?: number;
    username?: string;
    displayName?: string;
    email?: string;
  };
};

type BrandbookResponse = {
  brand_name: string;
  tagline: string;
  tone: string;
  colors: string[];
  typography: string[];
  imagery: string[];
  voice: string[];
  keywords: string[];
  do_dont: { do: string[]; dont: string[] };
  sample_copy: string[];
  pages: string[];
};

function base64Auth(user: string, pass: string) {
  return Buffer.from(`${user}:${pass}`).toString("base64");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;
    if (!body?.projectName || !body?.description) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const provider = body?.provider || "openai";

    const system =
      "You are a brand strategist. Return JSON only. Avoid accents if possible.";

    const userPrompt = `Create a concise brandbook JSON for this business.
Brand name: ${body.projectName}
Business type: ${body.businessType || "unknown"}
Description: ${body.description}
Colors: ${(body.colors || []).join(", ")}
Logo style: ${body.logoStyle || "not specified"}
Pages: ${(body.pages || []).join(", ")}
Return JSON exactly with keys: brand_name, tagline, tone, colors, typography, imagery, voice, keywords, do_dont (do/dont arrays), sample_copy, pages.`;

    const brandbook =
      provider === "gemini"
        ? await callGeminiJson<BrandbookResponse>(`${system}\n\n${userPrompt}`)
        : await callOpenAIJson<BrandbookResponse>([
            { role: "system", content: system },
            { role: "user", content: userPrompt },
          ]);

    const endpoint =
      process.env.WP_BRANDBOOK_ENDPOINT ||
      `${process.env.WP_BASE_URL}/wp-json/nl360/v1/brandbook`;

    const wpUser = process.env.WP_APP_USER;
    const wpPass = process.env.WP_APP_PASSWORD;

    if (!endpoint || !wpUser || !wpPass) {
      return NextResponse.json(
        { error: "Missing WordPress credentials" },
        { status: 500 }
      );
    }

    const wpPayload = {
      conversation_id: body.conversationId || "manu-default",
      project_name: body.projectName,
      brandbook,
      subdomain: body.subdomain || null,
      logo: body.logo || null,
      favicon: body.favicon || null,
      pages: body.pages || [],
      user: body.user || null,
    };

    const wpRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64Auth(wpUser, wpPass)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(wpPayload),
    });

    const wpText = await wpRes.text();
    if (!wpRes.ok) {
      return NextResponse.json(
        { error: "WP error", detail: wpText.slice(0, 400) },
        { status: 502 }
      );
    }

    let wpData: any = null;
    try {
      wpData = wpText ? JSON.parse(wpText) : null;
    } catch {
      wpData = wpText;
    }

    return NextResponse.json({ ok: true, brandbook, wp: wpData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "server_error" },
      { status: 500 }
    );
  }
}
