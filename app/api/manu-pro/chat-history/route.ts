import { NextResponse } from "next/server";

export const runtime = "nodejs";

function base64Auth(user: string, pass: string) {
  return Buffer.from(`${user}:${pass}`).toString("base64");
}

function getWpEndpoint() {
  const base = process.env.WP_BASE_URL;
  if (!base) throw new Error("Missing WP_BASE_URL");
  return `${base}/wp-json/nl360/v1/chat-history`;
}

export async function GET() {
  try {
    const user = process.env.WP_APP_USER;
    const pass = process.env.WP_APP_PASSWORD;
    if (!user || !pass) {
      return NextResponse.json(
        { error: "Missing WordPress credentials" },
        { status: 500 }
      );
    }

    const wpRes = await fetch(getWpEndpoint(), {
      headers: {
        Authorization: `Basic ${base64Auth(user, pass)}`,
      },
      cache: "no-store",
    });

    const text = await wpRes.text();
    if (!wpRes.ok) {
      return NextResponse.json(
        { error: "WP error", detail: text.slice(0, 400) },
        { status: 502 }
      );
    }

    const data = text ? JSON.parse(text) : { ok: true, items: [] };
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "server_error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = process.env.WP_APP_USER;
    const pass = process.env.WP_APP_PASSWORD;
    if (!user || !pass) {
      return NextResponse.json(
        { error: "Missing WordPress credentials" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const wpRes = await fetch(getWpEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64Auth(user, pass)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await wpRes.text();
    if (!wpRes.ok) {
      return NextResponse.json(
        { error: "WP error", detail: text.slice(0, 400) },
        { status: 502 }
      );
    }

    const data = text ? JSON.parse(text) : { ok: true };
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "server_error" },
      { status: 500 }
    );
  }
}
