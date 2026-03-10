import { NextResponse } from "next/server";

const WP_BASE_URL = process.env.WP_BASE_URL!;
const COOKIE_NAME = process.env.NL360_JWT_COOKIE_NAME || "nl360_jwt";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Missing username/password" },
        { status: 400 }
      );
    }

    // WP JWT login
    const wpRes = await fetch(`${WP_BASE_URL}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // IMPORTANT: do not forward user cookies to WP here
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });

    const data = await wpRes.json();

    if (!wpRes.ok || !data?.token) {
      return NextResponse.json(
        { ok: false, error: data?.message || "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = data.token as string;

    const res = NextResponse.json({ ok: true });

    // Cookie httpOnly: WP is source of truth, Next stores JWT
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // 7 días (ajustable). Si preferís atarte al exp del JWT, lo hacemos después.
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}
