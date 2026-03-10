"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import DotGrid from "@/components/DotGrid";


export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const autoCollapsedRef = useRef(false);

  const sidebarWidth = useMemo(() => (collapsed ? 84 : 300), [collapsed]);

  useEffect(() => {
    const isManuPro = pathname?.startsWith("/services/manu-pro");
    if (isManuPro && !collapsed) {
      setCollapsed(true);
      setMobileOpen(false);
      autoCollapsedRef.current = true;
      return;
    }

    if (!isManuPro && autoCollapsedRef.current) {
      setCollapsed(false);
      autoCollapsedRef.current = false;
    }
  }, [pathname, collapsed]);

  return (
    <div
      className="min-h-dvh bg-white text-zinc-900"
      style={{ ["--sidebar-w" as any]: `${sidebarWidth}px` }}
    >
      {/* Overlay mobile */}
      {mobileOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="nl-main">
        <div className="relative h-full w-full">
            <DotGrid />
            <div className="relative z-10 h-full w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
