"use client";

import { useState } from "react";

export default function ServiceNotice() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm text-zinc-700 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400 mt-1" />
        <div className="flex-1">
          En este momento el servidor esta en pausa para la construccion de nuevas
          features, la IA igual puede trabajar pero pueden haber errores.
        </div>
        <button
          onClick={() => setVisible(false)}
          className="rounded-full px-2 text-zinc-500 hover:text-zinc-800"
          aria-label="Cerrar aviso"
          title="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
