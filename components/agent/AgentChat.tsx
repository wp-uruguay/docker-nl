"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type UIBlock =
  | {
      type: "choices";
      id: string;
      label?: string;
      choices: { id: string; label: string }[];
    }
  | {
      type: "color_picker";
      id: string;
      label?: string;
      suggested: { id: string; hex: string; name?: string }[];
      allow_custom?: boolean;
      mode?: "primary_then_secondary" | "any";
    }
  | {
      type: "image";
      id: string;
      url: string;
      alt?: string;
      caption?: string;
    }
  | {
      type: "text_hint";
      id: string;
      text: string;
    };

type AgentResponse = {
  ok: boolean;
  reply_text: string;
  ui?: UIBlock[];
  state?: any;
  status?: "collecting" | "ready" | "creating" | "done";
  action?: null | { type: "navigate"; href: string } | { type: "toast"; message: string };
};

type ChatMessage =
  | { role: "agent"; text: string; ui?: UIBlock[] }
  | { role: "user"; text: string };

function isHexColor(v: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}

export default function AgentChat({
  agent,
  endpoint = "/api/agent-message",
  conversationId,
}: {
  agent: string;
  endpoint?: string;
  conversationId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // estado local (cache). La verdad final la decide el workflow.
  const [state, setState] = useState<any>({});

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendPayload(payload: { message?: string; choice_id?: string; ui_value?: any }) {
    try {
      setSending(true);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // IMPORTANTE: el workflow debe usar cookie jwt_nl360 del request al backend /api/agent-message
        body: JSON.stringify({
          conversation_id: conversationId,
          agent,
          message: payload.message ?? null,
          choice_id: payload.choice_id ?? null,
          ui_value: payload.ui_value ?? null,
          state, // cache local
        }),
      });

      const data = (await res.json()) as AgentResponse;

      if (!data?.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "agent", text: "Tuve un problema hablando con el servidor. Probá de nuevo." },
        ]);
        return;
      }

      // Guardar el state que viene del workflow (si existe)
      if (typeof data.state !== "undefined") setState(data.state);

      // Mostrar respuesta del agente + UI
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: data.reply_text || "…", ui: data.ui || [] },
      ]);

      // Acciones opcionales (MVP: solo navigate)
      if (data.action?.type === "navigate" && data.action.href) {
        window.location.href = data.action.href;
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "Error de red. Revisá tu conexión o el endpoint." },
      ]);
    } finally {
      setSending(false);
    }
  }

  // Al montar: pedir saludo inicial (sin mensaje del usuario)
  useEffect(() => {
    // si ya hay mensajes, no re-dispares
    if (messages.length > 0) return;

    // “ping” para que el workflow conteste el primer mensaje
    sendPayload({ message: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSendText() {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    await sendPayload({ message: text });
  }

  async function onChoice(choiceId: string, label: string) {
    if (sending) return;

    setMessages((prev) => [...prev, { role: "user", text: label }]);
    await sendPayload({ choice_id: choiceId });
  }

  async function onPickColor(blockId: string, hex: string) {
    if (!isHexColor(hex) || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: `Color: ${hex}` }]);
    await sendPayload({ ui_value: { type: "color", block_id: blockId, hex } });
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={[
                "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                m.role === "user" ? "bg-black text-white" : "bg-white border",
              ].join(" ")}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</div>

              {m.role === "agent" && m.ui && m.ui.length > 0 && (
                <div className="mt-3 space-y-3">
                  {m.ui.map((block) => (
                    <UIRenderer
                      key={block.id}
                      block={block}
                      onChoice={onChoice}
                      onPickColor={onPickColor}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-white p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
            placeholder="Escribí tu mensaje…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSendText();
            }}
            disabled={sending}
          />
          <button
            className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            onClick={onSendText}
            disabled={!canSend}
          >
            {sending ? "..." : "Enviar"}
          </button>
        </div>

        <div className="mt-2 text-xs text-black/50">
          Tip: si el agente te da botones, podés tocar una opción sin escribir.
        </div>
      </div>
    </div>
  );
}

function UIRenderer({
  block,
  onChoice,
  onPickColor,
}: {
  block: UIBlock;
  onChoice: (choiceId: string, label: string) => void;
  onPickColor: (blockId: string, hex: string) => void;
}) {
  if (block.type === "text_hint") {
    return <div className="text-xs text-black/60">{block.text}</div>;
  }

  if (block.type === "image") {
    return (
      <div className="space-y-2">
        <img
          src={block.url}
          alt={block.alt || "imagen"}
          className="w-full max-w-sm rounded-xl border"
        />
        {block.caption && <div className="text-xs text-black/60">{block.caption}</div>}
      </div>
    );
  }

  if (block.type === "choices") {
    return (
      <div className="space-y-2">
        {block.label && <div className="text-xs font-medium text-black/70">{block.label}</div>}
        <div className="flex flex-wrap gap-2">
          {block.choices.map((c) => (
            <button
              key={c.id}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-black hover:text-white transition"
              onClick={() => onChoice(c.id, c.label)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "color_picker") {
    return (
      <div className="space-y-2">
        {block.label && <div className="text-xs font-medium text-black/70">{block.label}</div>}
        <div className="flex flex-wrap gap-2">
          {block.suggested.map((c) => (
            <button
              key={c.id}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-black/5"
              onClick={() => onPickColor(block.id, c.hex)}
              title={c.name || c.hex}
            >
              <span
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: c.hex }}
              />
              <span>{c.name || c.hex}</span>
            </button>
          ))}
        </div>

        {block.allow_custom && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-black/60">Otro:</span>
            <input
              type="color"
              className="h-8 w-10 rounded border p-0"
              onChange={(e) => onPickColor(block.id, e.target.value)}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
