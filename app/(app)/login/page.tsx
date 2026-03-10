"use client";

import { useEffect, useState } from "react";

function safeNextPath(): string {
  if (typeof window === "undefined") return "/";
  const url = new URL(window.location.href);
  const n = url.searchParams.get("next");
  return n && n.startsWith("/") ? n : "/";
}

export default function LoginPage() {
  const [nextPath, setNextPath] = useState<string>("/");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setNextPath(safeNextPath());
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setError(data?.error || "Login failed");
        return;
      }

      // HARD redirect: asegura que middleware vea la cookie en el próximo request
      window.location.assign(nextPath);
    } catch {
      setError("Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-white text-zinc-900">
      {/* Decor */}
      <div className="pointer-events-none absolute -left-32 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-white via-white/80 to-white/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_70%_25%,rgba(15,23,42,0.06),transparent_60%)]" />
      <div className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full bg-gradient-to-br from-sky-200/50 via-sky-200/20 to-indigo-300/10 blur-3xl nl-blob-wave" />

      <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left */}
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://nl360.site/wp-content/uploads/2026/01/Isologotipo-NL360-Black.png"
            alt="NL360"
            className="h-10 w-auto"
          />
          <h1 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight">
            Inicia sesión en Backoffice 360
          </h1>
          <p className="mt-3 max-w-xl text-base text-zinc-600">
            Accedé a tus agentes, automatizaciones y panel de cliente con tu usuario
            de WordPress.
          </p>

          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Seguridad y acceso centralizado
          </div>
        </div>

        {/* Card */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-zinc-900/10 to-zinc-900/0" />
          <div className="relative rounded-3xl border border-zinc-200 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500">NL360</div>
                <div className="text-lg font-semibold">Login</div>
              </div>
              <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                Backoffice
              </span>
            </div>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Usuario
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
                  placeholder="tuusuario"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Contraseña
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
                  placeholder="••••••••"
                />
              </label>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
