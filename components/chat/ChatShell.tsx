"use client";

import { useMemo, useRef, useState } from "react";
import type { ChatMessage } from "./types";
import ChatMessageItem from "./ChatMessage";
import VoiceInput from "./VoiceInput";

/**
 * Utils básicos (ya los tenías o los veníamos usando)
 */
function uid() {
  return Math.random().toString(16).slice(2);
}

function convId() {
  // Persistente por tab (para demo). Luego: conversationId real desde backend/DB.
  if (typeof window === "undefined") return "ssr";
  const w = window as any;
  if (!w.__NL360_CONV__) w.__NL360_CONV__ = Math.random().toString(16).slice(2);
  return w.__NL360_CONV__ as string;
}

function agentSlug(agentName: string): "manu" | "vilma" | "grant" | "mentoria" {
  const v = agentName.trim().toLowerCase();
  if (v === "mentoria" || v === "mentoriaia" || v === "mentoria ia") return "mentoria";
  if (v === "manu") return "manu";
  if (v === "vilma") return "vilma";
  return "grant";
}

/**
 * ✅ VOICE FLAG (fallback borrable)
 * - Se controla con NEXT_PUBLIC_VOICE_FALLBACK=1 (build-time en Docker)
 */
const VOICE_ENABLED = process.env.NEXT_PUBLIC_VOICE_FALLBACK === "1";

/**
 * ✅ TTS (Text-to-Speech) helpers (fallback borrable)
 * - No toca backend.
 * - Usa Web Speech API del navegador.
 */
function canTTS() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function speak(text: string, lang = "es-ES") {
  if (!canTTS()) return;

  // Evita que se encimen frases si llega otra respuesta rápido
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;

  // Intenta elegir una voz en español si existe (si no, usa la default)
  const voices = window.speechSynthesis.getVoices?.() ?? [];
  const preferred =
    voices.find((v) => v.lang?.toLowerCase() === lang.toLowerCase()) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith("es")) ||
    null;

  if (preferred) u.voice = preferred;

  window.speechSynthesis.speak(u);
}

function stopSpeak() {
  if (!canTTS()) return;
  window.speechSynthesis.cancel();
}

export default function ChatShell({
  agentName,
  seedMessage,
  onUserMessage, // ✅ NUEVO
}: {
  agentName: string;
  seedMessage: ChatMessage[];
  onUserMessage?: (text: string) => void; // ✅ NUEVO
}) {

  const [messages, setMessages] = useState<ChatMessage[]>(seedMessage);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  /**
   * ✅ TTS state (fallback borrable)
   * - Toggle para que el cliente active/desactive lectura de respuestas
   */
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const TTS_LANG = "es-ES";

  const canSend = input.trim().length > 0 && !isSending;

  const header = useMemo(() => {
    return {
      title: agentName,
      subtitle: "Chat (UI base). Backend: /api/agent-message (demo).",
    };
  }, [agentName]);

  /**
   * sendText(): envío centralizado
   * ✅ Lo usamos tanto para texto escrito como para texto detectado por voz.
   */
  async function sendText(rawText: string) {
    const text = rawText.trim();
    if (!text) return;
    if (isSending) return;

    // ✅ NUEVO: permite que la page de Manu dispare generación automática
    onUserMessage?.(text);


    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      text,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const r = await fetch("/api/agent-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId(),
          agent: agentSlug(agentName),
          message: { text },
        }),
      });

      if (!r.ok) {
        const errText = await r.text();
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            text: `Error API (${r.status}): ${errText}`,
            createdAt: Date.now(),
          },
        ]);
        return;
      }

      const data = (await r.json()) as { assistant: ChatMessage };

      setMessages((prev) => [...prev, data.assistant]);

      /**
       * ✅ TTS: hablar respuesta del assistant si el toggle está ON
       * - Esto es 100% UI y es fácil de borrar.
       */
      if (ttsEnabled && data?.assistant?.text) {
        speak(data.assistant.text, TTS_LANG);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          text: `Error de red: ${e?.message ?? "unknown"}`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
      // scroll al final
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
    }
  }

  /**
   * send(): envío desde input (teclado)
   */
  async function send() {
    if (!canSend) return;
    const text = input.trim();
    setInput("");
    await sendText(text);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="text-sm text-muted-foreground">{header.subtitle}</div>
        <div className="text-xl font-semibold">{header.title}</div>
      </div>

      <div className="rounded-xl border">
        <div className="h-[60dvh] overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <ChatMessageItem key={m.id} msg={m} />
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t p-3 flex flex-wrap gap-2 items-center">
          <input
            className="flex-1 min-w-[220px] rounded-md border px-3 py-2 text-sm"
            placeholder="Escribe un mensaje…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            disabled={isSending}
          />

          {/* ✅ VOICE INPUT (fallback borrable) */}
          {VOICE_ENABLED && (
            <VoiceInput
              disabled={isSending}
              lang="es-ES"
              onText={(t) => {
                // opcional: mostrar el texto reconocido en el input
                setInput(t);
                // auto-enviar para que se sienta “tipo asistente”
                sendText(t);
              }}
            />
          )}

          {/* ✅ TTS TOGGLE (fallback borrable) */}
          <button
            type="button"
            onClick={() => setTtsEnabled((v) => !v)}
            className="rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
            title="Leer en voz alta las respuestas"
          >
            {ttsEnabled ? "🔊 Voz ON" : "🔇 Voz OFF"}
          </button>

          {/* ✅ STOP TTS (fallback borrable) */}
          {ttsEnabled && (
            <button
              type="button"
              onClick={() => stopSpeak()}
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
              title="Detener voz"
            >
              ⏹️ Stop
            </button>
          )}

          <button
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted/50 disabled:opacity-50"
            disabled={!canSend}
            onClick={send}
          >
            {isSending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
