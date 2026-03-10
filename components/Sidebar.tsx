"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faWandMagicSparkles,
  faBullhorn,
  faHandshake,
  faGraduationCap,
  faAnglesLeft,
  faAnglesRight,
  faBars,
  faUser,
  faRightFromBracket,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons";

const NAV = [
  { href: "/", label: "Home", icon: faHouse },
  { href: "/services/manu", label: "Manu", icon: faWandMagicSparkles },
  { href: "/services/vilma", label: "Margarita", icon: faBullhorn },
  { href: "/services/grant", label: "Jordan", icon: faHandshake },
  { href: "/services/mentoria", label: "MentorIA", icon: faGraduationCap },
];

type MeResponse = {
  ok: boolean;
  user?: {
    id: number;
    username: string;
    email?: string;
    displayName: string;
    roles?: string[];
    capabilities?: Record<string, boolean>;
  };
  plan?: { slug?: string; status?: string };
};

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadMe() {
      try {
        setMeLoading(true);
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as MeResponse | null;
        if (!alive) return;

        // Si no está autenticado, el middleware ya debería mandar a /login,
        // pero por las dudas:
        if (!res.ok || !data?.ok) {
          setMe(null);
          setMeLoading(false);
          return;
        }

        setMe(data);
        setMeLoading(false);
      } catch {
        if (!alive) return;
        setMe(null);
        setMeLoading(false);
      }
    }

    loadMe();
    return () => {
      alive = false;
    };
  }, []);

  const isAuthed = Boolean(me?.ok);
  const displayName = me?.user?.displayName || "Cuenta";
  const username = me?.user?.username ? `@${me.user.username}` : "";
  const membership = useMemo(() => {
    // 1) plan.slug (mejor)
    const planSlug = me?.plan?.slug;
    if (planSlug) return planSlug;

    // 2) roles: buscamos uno tipo nl360_*
    const roles = me?.user?.roles || [];
    const nlRole = roles.find((r) => r.startsWith("nl360_"));
    if (nlRole) return nlRole;

    // 3) fallback
    return "free";
  }, [me]);

  const widthClass = collapsed ? "w-[84px]" : "w-[300px]";
  const mobileTransform = mobileOpen ? "translate-x-0" : "-translate-x-[120%]";

  async function onLogout() {
    try {
      setLogoutLoading(true);
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // hard redirect para limpiar estado y que middleware haga lo suyo
      window.location.assign("/login");
    }
  }

  return (
    <aside
      className={[
        "fixed z-50",
        "top-3 left-3 bottom-3",
        widthClass,
        "rounded-[10px] bg-white",
        "shadow-[0_10px_35px_rgba(0,0,0,0.12)]",
        "overflow-hidden",
        "transition-all duration-200",
        // Desktop: siempre visible
        "md:translate-x-0",
        // Mobile: slide
        "md:!transform-none transform",
        "md:!translate-x-0",
        mobileTransform,
      ].join(" ")}
    >
      {/* header */}
      <div className="flex h-14 items-center justify-between px-3">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              collapsed
                ? "https://nl360.site/wp-content/uploads/2026/01/Isotipo-NL360-Black.svg"
                : "https://nl360.site/wp-content/uploads/2026/01/Isologotipo-NL360-Black.png"
            }
            alt="NL360"
            className={collapsed ? "h-8 w-8" : "h-8 w-auto"}
          />
        </Link>

        <div className="flex items-center gap-2">
          {/* mobile toggle */}
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-zinc-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle sidebar"
            title="Menu"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          {/* collapse toggle (desktop) */}
          <button
            className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-zinc-100"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Collapse sidebar"
            title={collapsed ? "Expandir" : "Contraer"}
          >
            <FontAwesomeIcon icon={collapsed ? faAnglesRight : faAnglesLeft} />
          </button>
        </div>
      </div>

      <div className="px-3 pb-3">
        {/* user card (solo si está logueado) */}
        {isAuthed && (
          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">Cuenta</div>

            {collapsed ? (
              <div className="mt-2 flex items-center justify-center text-zinc-900">
                <FontAwesomeIcon icon={faUser} />
              </div>
            ) : (
              <>
                <div className="mt-1 font-semibold leading-tight text-zinc-900">
                  {meLoading ? "Cargando..." : displayName}
                </div>
                <div className="text-xs text-zinc-600">
                  {meLoading ? "" : username}
                </div>

                <div className="mt-2 text-[11px] text-zinc-500">
                  Membresía:{" "}
                  <span className="text-zinc-700 font-semibold">
                    {meLoading ? "..." : membership}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    href="/mi-perfil"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                  >
                    <FontAwesomeIcon icon={faIdCard} />
                    Mi perfil
                  </Link>

                  <button
                    onClick={onLogout}
                    disabled={logoutLoading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
                    title="Salir"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    {logoutLoading ? "Saliendo..." : "Logout"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* nav */}
        <nav className="mt-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  active ? "bg-zinc-100 font-semibold" : "text-zinc-700 hover:bg-zinc-100",
                  collapsed ? "justify-center" : "",
                ].join(" ")}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <span className="inline-flex w-6 justify-center text-zinc-900">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="mt-4 rounded-xl border border-zinc-200 p-4 nl-dots-card">
            <div className="text-sm font-semibold text-zinc-900">Membresía</div>
            <p className="mt-1 text-xs text-zinc-700">
              Mejora, renueva o cancela tu membresía aquí.
            </p>
            <a
              href="https://nl360.site/niveles-de-membembresia/"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center justify-center rounded-md bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-900"
            >
              Membresías
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
