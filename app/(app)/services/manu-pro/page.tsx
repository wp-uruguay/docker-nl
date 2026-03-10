"use client";

import ServiceNotice from "@/components/ServiceNotice";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type StepId =
  | "welcome"
  | "businessName"
  | "description"
  | "colors"
  | "logoQuestion"
  | "logoUpload"
  | "logoStyle"
  | "pages"
  | "subdomain"
  | "brandbook"
  | "complete";

type BusinessType = "established" | "new" | null;
type LlmProvider = "openai" | "gemini";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  time: string;
};

type ChatHistoryItem = {
  id: string;
  title: string;
  last_message: string;
  last_message_at?: string;
  site_built?: boolean;
  site_url?: string;
  messages?: ChatMessage[];
};

type MeResponse = {
  ok: boolean;
  user?: {
    id: number;
    username: string;
    email?: string;
    displayName: string;
  };
};

const WELCOME_VARIANTS = [
  "Hola {nombre_de_usuario}, estas en un punto clave para tu negocio. Dime si es un proyecto nuevo o un negocio establecido.",
  "Hola {nombre_de_usuario}, este es un gran inicio. Contame si es un proyecto nuevo o un negocio ya establecido.",
  "Hola {nombre_de_usuario}, hoy damos un paso importante. Es un proyecto nuevo o un negocio establecido?",
  "Hola {nombre_de_usuario}, vamos a construir algo grande. Es un proyecto nuevo o un negocio establecido?",
  "Hola {nombre_de_usuario}, estas en el punto de partida ideal. Es un proyecto nuevo o un negocio ya activo?",
  "Hola {nombre_de_usuario}, iniciemos con claridad. Es un proyecto nuevo o un negocio establecido?",
  "Hola {nombre_de_usuario}, arrancamos fuerte. Es un proyecto nuevo o un negocio establecido?",
  "Hola {nombre_de_usuario}, este es el comienzo perfecto. Es un proyecto nuevo o un negocio establecido?",
  "Hola {nombre_de_usuario}, gracias por estar aqui. Es un proyecto nuevo o un negocio establecido?",
  "Hola {nombre_de_usuario}, estamos listos para empezar. Es un proyecto nuevo o un negocio establecido?",
];

const NAME_ESTABLISHED_VARIANTS = [
  "Excelente, como se llama tu negocio?",
  "Genial, cual es el nombre de tu negocio?",
  "Perfecto, decime el nombre de tu negocio.",
  "Buenisimo, como se llama tu negocio actualmente?",
  "Listo, contame el nombre de tu negocio.",
  "Dale, cual es el nombre de tu negocio?",
  "Vamos bien, como se llama tu negocio?",
  "Excelente, cual es el nombre oficial de tu negocio?",
  "Ok, como se llama tu negocio hoy?",
  "Fantastico, cual es el nombre de tu negocio?",
];

const NAME_NEW_VARIANTS = [
  "Ok, contame el nombre si ya lo definiste.",
  "Genial, ya tenes un nombre?",
  "Dale, si ya definiste un nombre contamelo.",
  "Perfecto, tenes un nombre pensado?",
  "Bien, como queres llamar al proyecto?",
  "Ok, si ya lo pensaste, cual es el nombre?",
  "Vamos, decime el nombre si ya lo elegiste.",
  "Listo, si ya definiste nombre contamelo.",
  "Bien, cual es el nombre del proyecto si ya lo tenes?",
  "Ok, contame el nombre si ya lo decidiste.",
];

const DESCRIPTION_VARIANTS = [
  "Ahora contame de que se trata {nombre_del_neocio}. Senti libre de detallar servicios, productos y personalidad de marca.",
  "Contame de que va {nombre_del_neocio}. Inclui servicios, productos y la personalidad de tu marca.",
  "Ahora describi {nombre_del_neocio}. Que ofreces y como es la personalidad de la marca?",
  "Hablemos de {nombre_del_neocio}. Que vendes o que servicios das y cual es el estilo de la marca?",
  "Describi {nombre_del_neocio} con detalle: productos, servicios y personalidad de marca.",
  "Ahora necesito contexto de {nombre_del_neocio}. Contame que haces y como es tu marca.",
  "Explicame {nombre_del_neocio}. Que ofreces y que personalidad queres transmitir?",
  "Cuanto mas detalles, mejor: de que se trata {nombre_del_neocio}?",
  "Vamos a entender {nombre_del_neocio}. Que servicios o productos ofreces y que estilo tiene?",
  "Contame todo sobre {nombre_del_neocio}: que vendes y como queres que se sienta la marca.",
];

const COLOR_VARIANTS = [
  "Ok, ahora vamos a definir la identidad de {nombre_del_neocio}. Empecemos por los colores de la marca.",
  "Vamos con la identidad de {nombre_del_neocio}. Elegi los colores principales de la marca.",
  "Definamos los colores de {nombre_del_neocio}.",
  "Empecemos por los colores que representan a {nombre_del_neocio}.",
  "Selecciona la paleta de colores para {nombre_del_neocio}.",
  "Ahora toca elegir colores para {nombre_del_neocio}.",
  "Color time: defini la paleta de {nombre_del_neocio}.",
  "Vamos a elegir la identidad visual de {nombre_del_neocio} con colores.",
  "Definamos los colores de marca para {nombre_del_neocio}.",
  "Elegi hasta 5 colores para representar a {nombre_del_neocio}.",
];

const LOGO_QUESTION_VARIANTS = [
  "Ya tenes logo?",
  "Tu negocio ya cuenta con logo?",
  "Tenes un logo listo?",
  "Cuentas con un logo actual?",
  "Ya hay logo para {nombre_del_neocio}?",
  "Tenes logo en este momento?",
  "Tu marca ya tiene logo?",
  "Tenes un logo definido?",
  "Tu negocio cuenta con un logo?",
  "Tenes logo propio?",
];

const LOGO_UPLOAD_VARIANTS = [
  "Pisando fuerte! Subi tu logo. Si no tenes favicon, dejalo en blanco.",
  "Perfecto! Carga el logo. El favicon es opcional.",
  "Genial! Subi tu logo. El favicon es opcional.",
  "Excelente! Sube el logo. Si no tenes favicon, no pasa nada.",
  "Buenisimo! Carga el logo aqui. Favicon opcional.",
  "Listo! Subi el logo y, si queres, el favicon.",
  "Vamos! Carga tu logo. El favicon es opcional.",
  "Fantastico! Subi el logo. Favicon si tenes.",
  "Muy bien! Carga el logo y el favicon si lo tenes.",
  "Ok! Subi el logo. El favicon puede quedar en blanco.",
];

const LOGO_STYLE_VARIANTS = [
  "Ok, manos a la obra. Que estilo preferis?",
  "Vamos a crear un logo. Que estilo te gusta?",
  "Listo, hagamos un logo. Elegi un estilo.",
  "Manos a la obra, elegi un estilo de logo.",
  "Bien, creemos tu logo. Que estilo preferis?",
  "Vamos con el logo. Selecciona un estilo.",
  "Perfecto, hagamos un logo. Elegi un estilo.",
  "Ok, diseñemos un logo. Que estilo elegis?",
  "Empecemos el logo. Que estilo te atrae?",
  "Vamos a crear tu logo. Que estilo queres?",
];

const PAGES_VARIANTS = [
  "Que te parece esta estructura de paginas para tu negocio?",
  "Te gusta esta estructura de paginas para tu sitio?",
  "Esta propuesta de paginas te parece bien?",
  "Te dejo una estructura sugerida. Que opinas?",
  "Sugerencia de paginas lista. Te gusta?",
  "Estas paginas pueden funcionar bien. Que te parece?",
  "Propuesta de estructura de sitio lista. Te gusta?",
  "Que opinas de esta estructura para el sitio?",
  "Te parece bien esta estructura de paginas?",
  "Te muestro una estructura sugerida. Te gusta?",
];

const SUBDOMAIN_VARIANTS = [
  "Ya casi estamos. Dime que subdominio queres usar hasta configurar el dominio.",
  "Estamos cerca del final. Que subdominio queres usar por ahora?",
  "Falta poco. Que subdominio queres utilizar?",
  "Ultimo tramo. Que subdominio queres para tu sitio?",
  "Casi listo. Que subdominio preferis?",
  "Ya casi termino. Elegi un subdominio temporal.",
  "Vamos con el subdominio. Cual queres usar?",
  "Definamos el subdominio temporal para tu sitio.",
  "Listo para elegir subdominio. Cual queres?",
  "Una mas: que subdominio te gustaria usar?",
];

function pickRandom(values: string[]) {
  return values[Math.floor(Math.random() * values.length)];
}

function template(text: string, tokens: Record<string, string>) {
  return text.replace(/\{(.*?)\}/g, (_, key: string) => tokens[key] || "");
}

function isNoName(input: string) {
  const value = input.toLowerCase().trim();
  return (
    value.includes("no tengo") ||
    value.includes("no lo defini") ||
    value.includes("aun no") ||
    value.includes("todavia no") ||
    value.includes("no definido") ||
    value === "no" ||
    value === "ninguno"
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("file_read_error"));
    reader.readAsDataURL(file);
  });
}

export default function ManuProPage() {
  const [step, setStep] = useState<StepId>("welcome");
  const [message, setMessage] = useState<string>(pickRandom(WELCOME_VARIANTS));
  const [inputValue, setInputValue] = useState("");
  const [loadingAction, setLoadingAction] = useState<
    null | "names" | "colors" | "logo" | "pages" | "brandbook"
  >(null);
  const [error, setError] = useState<string | null>(null);

  const [businessType, setBusinessType] = useState<BusinessType>(null);
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [colors, setColors] = useState<string[]>(["#18181B", "#E4E4E7"]);
  const [logoChoice, setLogoChoice] = useState<"upload" | "generate" | null>(null);
  const [logoStyle, setLogoStyle] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [faviconDataUrl, setFaviconDataUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [colorMode, setColorMode] = useState<"manual" | "ai">("manual");
  const [userName, setUserName] = useState("Usuario");
  const [userMeta, setUserMeta] = useState<MeResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [llmProvider, setLlmProvider] = useState<LlmProvider>("openai");
  const [composerHeight, setComposerHeight] = useState(0);
  const [showScrollControl, setShowScrollControl] = useState(false);
  const [historyItems, setHistoryItems] = useState<ChatHistoryItem[]>([]);
  const [historyMode, setHistoryMode] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const lastStepRef = useRef<StepId | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<AudioContext | null>(null);

  function formatTime() {
    return new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function ensureAudio() {
    if (!audioRef.current) {
      audioRef.current = new AudioContext();
    }
    if (audioRef.current.state === "suspended") {
      audioRef.current.resume().catch(() => null);
    }
    return audioRef.current;
  }

  function playTone(frequency: number, duration = 0.08) {
    if (!hasInteracted) return;
    const ctx = ensureAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    osc.type = "sine";
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function addMessage(role: ChatMessage["role"], text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        role,
        text,
        time: formatTime(),
      },
    ]);
    if (role === "user") {
      setHasInteracted(true);
      playTone(720);
    } else {
      playTone(520);
    }
  }

  function pushUserMessage(text: string) {
    addMessage("user", text);
  }

  function pickVoice() {
    if (!voices.length) return null;
    return (
      voices.find((voice) => voice.lang?.toLowerCase().startsWith("es-ar")) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith("es-uy")) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith("es")) ||
      null
    );
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    utter.lang = voice?.lang || "es-AR";
    if (voice) utter.voice = voice;
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as MeResponse | null;
        if (res.ok && data?.ok) {
          setUserMeta(data);
          if (data.user?.displayName) {
            setUserName(data.user.displayName);
          }
        }
      } catch {
        setUserName("Usuario");
      }
    }

    loadMe();
  }, []);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/manu-pro/chat-history", {
          cache: "no-store",
        });
        const data = (await res.json().catch(() => null)) as
          | { items?: ChatHistoryItem[] }
          | null;
        if (res.ok && Array.isArray(data?.items)) {
          setHistoryItems(data.items);
        }
      } catch {
        setHistoryItems([]);
      }
    }

    loadHistory();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const result = event.results?.[0];
      if (!result) return;
      const transcript = String(result[0]?.transcript || "").trim();
      if (!transcript) return;
      setInputValue(transcript);
      if (result.isFinal) {
        processUserInput(transcript);
      }
    };

    recognition.onerror = () => {
      setError("No pude usar el microfono. Verifica permisos.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setVoiceSupported(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (historyMode) return;
    const tokens = {
      nombre_de_usuario: userName,
      nombre_del_neocio: businessName || "tu negocio",
      nombre_de_negocio: businessName || "tu negocio",
    };

    let nextMessage = "";
    if (step === "welcome") nextMessage = pickRandom(WELCOME_VARIANTS);
    if (step === "businessName") {
      nextMessage = pickRandom(
        businessType === "established" ? NAME_ESTABLISHED_VARIANTS : NAME_NEW_VARIANTS
      );
    }
    if (step === "description") nextMessage = pickRandom(DESCRIPTION_VARIANTS);
    if (step === "colors") nextMessage = pickRandom(COLOR_VARIANTS);
    if (step === "logoQuestion") nextMessage = pickRandom(LOGO_QUESTION_VARIANTS);
    if (step === "logoUpload") nextMessage = pickRandom(LOGO_UPLOAD_VARIANTS);
    if (step === "logoStyle") nextMessage = pickRandom(LOGO_STYLE_VARIANTS);
    if (step === "pages") nextMessage = pickRandom(PAGES_VARIANTS);
    if (step === "subdomain") nextMessage = pickRandom(SUBDOMAIN_VARIANTS);

    const finalMessage = template(nextMessage, tokens);
    setMessage(finalMessage);

    if (lastStepRef.current === step) return;
    lastStepRef.current = step;
    addMessage("assistant", finalMessage);
  }, [step, businessType, businessName, userName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!composerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setComposerHeight(entry.contentRect.height);
      }
    });
    observer.observe(composerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setHeaderHeight(entry.contentRect.height);
      }
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  function handleChatScroll() {
    const el = chatScrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollControl(distance > 120);
  }

  function scrollToBottom() {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function lastWords(input: string, count = 5) {
    const words = input.trim().split(/\s+/).filter(Boolean);
    return words.slice(-count).join(" ");
  }

  function handleHistorySelect(item: ChatHistoryItem) {
    if (!item) return;
    setHistoryMode(true);
    setMessages(item.messages || []);
    setActiveHistoryId(item.id);
  }

  function handleResumeChat() {
    setHistoryMode(false);
    setMessages([]);
    lastStepRef.current = null;
    setActiveHistoryId(null);
    setStep("welcome");
  }

  async function saveHistory(update: Partial<ChatHistoryItem> = {}) {
    if (historyMode) return;
    const payload = {
      id: activeHistoryId || undefined,
      title: update.title || businessName || "Chat",
      last_message:
        update.last_message || messages[messages.length - 1]?.text || "",
      last_message_at: new Date().toISOString(),
      site_built: update.site_built ?? false,
      site_url: update.site_url || "",
      messages: update.messages || messages,
    };

    try {
      const res = await fetch("/api/manu-pro/chat-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as
        | { item?: ChatHistoryItem }
        | null;
      if (res.ok && data?.item?.id) {
        setActiveHistoryId(data.item.id);
        setHistoryItems((prev) => {
          const next = prev.filter((item) => item.id !== data.item?.id);
          return [data.item as ChatHistoryItem, ...next];
        });
      }
    } catch {
      // ignore
    }
  }

  const canSubmitInput = useMemo(() => {
    return ["businessName", "description", "subdomain"].includes(step);
  }, [step]);

  async function processUserInput(valueRaw: string) {
    if (!canSubmitInput) return;
    const value = valueRaw.trim();
    if (!value) return;

    setError(null);
    addMessage("user", value);
    setInputValue("");

    if (step === "businessName") {
      if (isNoName(value)) {
        setLoadingAction("names");
        try {
          const res = await fetch("/api/manu-pro/name-suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessType,
              hint: description || undefined,
              provider: llmProvider,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "error");
          setNameSuggestions(data.names || []);
        } catch (err: any) {
          setError(err?.message || "No pude generar nombres");
        } finally {
          setLoadingAction(null);
        }
        return;
      }

      setBusinessName(value);
      setNameSuggestions([]);
      setStep("description");
      return;
    }

    if (step === "description") {
      setDescription(value);
      setStep("colors");
      return;
    }

    if (step === "subdomain") {
      setSubdomain(value.toLowerCase());
      setStep("brandbook");
    }
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSubmitInput) return;
    await processUserInput(inputValue);
  }

  function toggleListening() {
    if (!voiceSupported || !recognitionRef.current) return;
    setHasInteracted(true);
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    setError(null);
    setIsListening(true);
    recognitionRef.current.start();
  }

  async function handleColorHelp() {
    setLoadingAction("colors");
    setError(null);
    try {
      const res = await fetch("/api/manu-pro/color-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: businessName,
          description,
          provider: llmProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "error");
      if (Array.isArray(data.colors) && data.colors.length > 0) {
        setColors(data.colors);
      }
      setColorMode("ai");
    } catch (err: any) {
      setError(err?.message || "No pude sugerir colores");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleLogoStyle(style: string) {
    setLogoStyle(style);
    setLoadingAction("logo");
    setError(null);
    try {
      const res = await fetch("/api/manu-pro/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: businessName,
          description,
          colors,
          style,
          provider: llmProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "error");
      setLogoDataUrl(data.dataUrl || null);
    } catch (err: any) {
      setError(err?.message || "No pude generar el logo");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handlePagesSuggestion() {
    setLoadingAction("pages");
    setError(null);
    try {
      const res = await fetch("/api/manu-pro/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: businessName,
          description,
          provider: llmProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "error");
      setPages(Array.isArray(data.pages) ? data.pages : []);
    } catch (err: any) {
      setError(err?.message || "No pude sugerir paginas");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleBrandbook() {
    setLoadingAction("brandbook");
    setError(null);
    try {
      const res = await fetch("/api/manu-pro/brandbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: "manu-pro",
          projectName: businessName,
          businessType: businessType || undefined,
          description,
          colors,
          provider: llmProvider,
          logo: {
            source: logoChoice === "upload" ? "uploaded" : "generated",
            dataUrl: logoDataUrl || null,
          },
          favicon: { dataUrl: faviconDataUrl || null },
          logoStyle,
          pages,
          subdomain,
          user: userMeta?.user,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "error");
      setStep("complete");
      await saveHistory({
        title: businessName || "Chat",
        site_built: true,
        site_url: data?.wp?.site_url || data?.wp?.url || "",
        messages,
      });
    } catch (err: any) {
      setError(err?.message || "No pude guardar el brandbook");
    } finally {
      setLoadingAction(null);
    }
  }

  useEffect(() => {
    if (historyMode) return;
    if (messages.length === 0) return;
    const timeout = window.setTimeout(() => {
      saveHistory();
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [messages, historyMode]);

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_#f4f4f5,_#ffffff_60%)] text-zinc-900">
      <ServiceNotice />
      <div className="min-h-dvh w-full px-6" style={{ paddingTop: headerHeight + 24 }}>
          <div
            ref={headerRef}
            className="nl-service-header fixed top-0 z-40 border-b border-zinc-200 bg-transparent px-6 py-4 backdrop-blur"
          >
            <div className="mx-auto w-full max-w-[900px]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-500">Manu Pro</div>
                  <div className="text-lg font-semibold text-zinc-900">
                    Asistente de identidad y sitio
                  </div>
                </div>
                <div className="text-xs text-zinc-500">Ultimos chats</div>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {historyItems.length === 0 ? (
                  <div className="text-xs text-zinc-500">Sin historial aun.</div>
                ) : (
                  historyItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleHistorySelect(item)}
                      className="relative w-52 flex-shrink-0 rounded-2xl border border-zinc-200 bg-transparent px-3 py-2 text-left text-xs text-zinc-700 shadow-sm hover:border-zinc-400"
                    >
                      <span
                        className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
                          item.site_built ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <div className="font-semibold text-zinc-900">
                        {item.title || "Chat"}
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500">
                        {lastWords(item.last_message || "", 5)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div
            className="relative mx-auto flex min-h-0 w-full max-w-[900px] flex-col rounded-3xl border border-zinc-200 bg-transparent shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
            style={{ height: `calc(100dvh - ${headerHeight + 24}px)` }}
          >
          <div
            ref={chatScrollRef}
            onScroll={handleChatScroll}
            className="flex-1 min-h-0 space-y-4 overflow-y-auto px-6 pt-6"
            style={{ paddingBottom: composerHeight + 28 }}
          >
            {historyMode && (
              <div className="rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm text-zinc-700">
                Viendo historial. Para continuar el chat actual, pulsa reanudar.
                <button
                  onClick={handleResumeChat}
                  className="ml-3 rounded-full border border-zinc-200 bg-transparent px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  Reanudar
                </button>
              </div>
            )}
            {messages.map((item) => (
              <div
                key={item.id}
                className={`flex ${
                  item.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div className="max-w-[85%]">
                  <div
                    className={`nl-chat-bubble rounded-2xl px-4 py-3 text-sm md:text-base shadow-sm ${
                      item.role === "assistant"
                        ? "border border-zinc-200 bg-transparent text-zinc-800"
                        : "bg-zinc-900 text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wide opacity-60">
                      <span>{item.role === "assistant" ? "MANU" : "Tu"}</span>
                      {item.role === "assistant" && (
                        <button
                          className="rounded-full p-1 text-zinc-500 hover:text-zinc-700"
                          onClick={() => speak(item.text)}
                          title="Escuchar"
                          aria-label="Escuchar mensaje"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 5L6 9H3v6h3l5 4z" />
                            <path d="M19 9a4 4 0 010 6" />
                            <path d="M19 5a8 8 0 010 14" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="mt-1 break-words whitespace-pre-line">
                      {item.text}
                    </div>
                  </div>
                  <div
                    className={`mt-1 text-[11px] text-zinc-400 ${
                      item.role === "assistant" ? "text-left" : "text-right"
                    }`}
                  >
                    {item.time}
                  </div>
                </div>
              </div>
            ))}

            {loadingAction && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm text-zinc-600 shadow-sm">
                  Manu esta pensando...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />

            {!historyMode && step === "welcome" && (
              <div className="flex flex-wrap items-center justify-start gap-2">
                <button
                  className="rounded-full border border-zinc-200 bg-transparent px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                  onClick={() => {
                    pushUserMessage("Negocio establecido");
                    setBusinessType("established");
                    setStep("businessName");
                  }}
                >
                  Negocio establecido
                </button>
                <button
                  className="rounded-full border border-zinc-200 bg-transparent px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                  onClick={() => {
                    pushUserMessage("Proyecto nuevo");
                    setBusinessType("new");
                    setStep("businessName");
                  }}
                >
                  Proyecto nuevo
                </button>
              </div>
            )}

            {!historyMode && step === "businessName" && nameSuggestions.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-transparent p-4">
                <div className="text-sm text-zinc-700">
                  Sugerencias de nombres:
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {nameSuggestions.map((name) => (
                    <button
                      key={name}
                      className="rounded-full border border-zinc-200 bg-transparent px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                      onClick={() => {
                        pushUserMessage(name);
                        setBusinessName(name);
                        setNameSuggestions([]);
                        setStep("description");
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!historyMode && step === "colors" && (
              <div className="rounded-2xl border border-zinc-200 bg-transparent p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {colors.map((color, index) => (
                    <label
                      key={`${color}-${index}`}
                      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-zinc-200"
                      style={{ background: color }}
                    >
                      <input
                        type="color"
                        value={color}
                        className="h-12 w-12 cursor-pointer opacity-0"
                        onChange={(event) => {
                          const next = [...colors];
                          next[index] = event.target.value.toUpperCase();
                          setColors(next);
                        }}
                      />
                    </label>
                  ))}
                  {colors.length < 5 && (
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-lg text-zinc-500 hover:border-zinc-500"
                      onClick={() => setColors([...colors, "#FFFFFF"])}
                      aria-label="Agregar color"
                    >
                      +
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                    onClick={() => {
                      pushUserMessage("Listo");
                      setStep("logoQuestion");
                    }}
                  >
                    Listo
                  </button>
                  <button
                    className="rounded-full border border-zinc-200 bg-transparent px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                    onClick={handleColorHelp}
                    disabled={loadingAction === "colors"}
                  >
                    {colorMode === "ai" ? "Elegir de nuevo" : "Ayudame"}
                  </button>
                </div>
              </div>
            )}

            {!historyMode && step === "logoQuestion" && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="rounded-full border border-zinc-200 bg-transparent px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                  onClick={() => {
                    pushUserMessage("Si ya tengo");
                    setLogoChoice("upload");
                    setStep("logoUpload");
                  }}
                >
                  Si ya tengo
                </button>
                <button
                  className="rounded-full border border-zinc-200 bg-transparent px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                  onClick={() => {
                    pushUserMessage("Aun no");
                    setLogoChoice("generate");
                    setStep("logoStyle");
                  }}
                >
                  Aun no
                </button>
              </div>
            )}

            {!historyMode && step === "logoUpload" && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rounded-2xl border border-zinc-200 bg-transparent p-4">
                  <div className="text-sm font-semibold text-zinc-900">Cargar logo</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Carga el logo de tu negocio, se guardara con tu perfil.
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-3 w-full text-sm"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await readFileAsDataUrl(file);
                      setLogoDataUrl(dataUrl);
                    }}
                  />
                </label>
                <label className="rounded-2xl border border-zinc-200 bg-transparent p-4">
                  <div className="text-sm font-semibold text-zinc-900">
                    Cargar favicon
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    El favicon es el icono de tu logo. Si no lo tienes no pasa nada.
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-3 w-full text-sm"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await readFileAsDataUrl(file);
                      setFaviconDataUrl(dataUrl);
                    }}
                  />
                </label>
                <div className="md:col-span-2 flex items-center gap-3">
                  <button
                    className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                    onClick={() => {
                      pushUserMessage("Continuar");
                      setStep("pages");
                    }}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {!historyMode && step === "logoStyle" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {["Moderno", "Elegante", "Minimalista", "Corporativo"].map(
                    (style) => (
                      <button
                        key={style}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold hover:bg-zinc-100 ${
                          logoStyle === style
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-transparent text-zinc-900"
                        }`}
                        onClick={() => {
                          pushUserMessage(style);
                          handleLogoStyle(style);
                        }}
                        disabled={loadingAction === "logo"}
                      >
                        {style}
                      </button>
                    )
                  )}
                </div>
                {logoDataUrl && (
                  <div className="rounded-2xl border border-zinc-200 bg-transparent p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoDataUrl} alt="Logo generado" className="w-full" />
                  </div>
                )}
                <div>
                  <button
                    className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                    onClick={() => {
                      pushUserMessage("Continuar");
                      setStep("pages");
                    }}
                    disabled={!logoDataUrl}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {!historyMode && step === "pages" && (
              <div className="space-y-4">
                {pages.length === 0 && (
                  <button
                    className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                    onClick={handlePagesSuggestion}
                    disabled={loadingAction === "pages"}
                  >
                    Generar estructura
                  </button>
                )}
                {pages.length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-transparent p-4">
                    <ul className="grid gap-2 text-sm text-zinc-800">
                      {pages.map((page) => (
                        <li key={page} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2">
                          {page}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                        onClick={() => {
                          pushUserMessage("Me gusta");
                          setStep("subdomain");
                        }}
                      >
                        Me gusta
                      </button>
                      <button
                        className="rounded-full border border-zinc-200 bg-transparent px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                        onClick={() => {
                          pushUserMessage("Prueba con otra");
                          handlePagesSuggestion();
                        }}
                        disabled={loadingAction === "pages"}
                      >
                        Prueba con otra
                      </button>
                      <div className="text-xs text-zinc-500">
                        Recuerda que mas adelante la puedes editar.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!historyMode && step === "subdomain" && (
              <div className="rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm text-zinc-700">
                <strong>Escribe solo el nombre de subdominio que quieres utilizar.</strong>
                <div className="mt-2 text-xs text-zinc-500">
                  Ejemplo: {businessName ? businessName.toLowerCase() : "mi-negocio"}.nl360.site
                </div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  La validacion automatica con WordPress se completara en una integracion
                  posterior.
                </div>
              </div>
            )}

            {!historyMode && step === "brandbook" && (
              <div className="rounded-2xl border border-zinc-200 bg-transparent p-4">
                <div className="text-sm text-zinc-700">
                  Generando brandbook y guardando en WordPress...
                </div>
                <div className="mt-3">
                  <button
                    className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                    onClick={handleBrandbook}
                    disabled={loadingAction === "brandbook"}
                  >
                    {loadingAction === "brandbook" ? "Procesando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            )}

            {!historyMode && step === "complete" && (
              <div className="rounded-2xl border border-zinc-200 bg-transparent p-6 text-center">
                <div className="text-lg font-semibold text-zinc-900">
                  Listo! Tu brandbook ya esta guardado.
                </div>
                <div className="mt-2 text-sm text-zinc-600">
                  Ahora generaremos el sitio en la red multisite con la identidad definida.
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-transparent px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {showScrollControl && (
              <button
                onClick={scrollToBottom}
                className="sticky bottom-6 ml-auto flex items-center gap-2 rounded-full border border-zinc-200 bg-transparent px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur hover:bg-zinc-100"
              >
                Ir al ultimo mensaje
              </button>
            )}
          </div>

          <div
            ref={composerRef}
            className="absolute inset-x-0 bottom-0 px-6 pb-5"
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-zinc-200 bg-transparent px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                <span className="font-semibold text-zinc-700">
                  Elige modelo de LLM
                </span>
                <select
                  value={llmProvider}
                  onChange={(event) => setLlmProvider(event.target.value as LlmProvider)}
                  className="rounded-lg border border-zinc-200 bg-transparent px-2 py-1 text-xs text-zinc-700 shadow-sm"
                >
                  <option value="openai">OpenAI (gpt-4o)</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>
              {step === "description" ? (
                <textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Escribe aqui..."
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
                />
              ) : (
                <input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Escribe aqui..."
                  disabled={!canSubmitInput}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
                />
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={!canSubmitInput}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Enviar
                </button>
                <button
                  type="button"
                  disabled={!voiceSupported || !canSubmitInput}
                  onClick={toggleListening}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                    isListening
                      ? "border-emerald-500 bg-transparent text-emerald-700"
                      : "border-zinc-200 bg-transparent text-zinc-700 hover:bg-zinc-100"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  title={voiceSupported ? "Mensaje por voz" : "Voz no disponible"}
                  aria-label="Mensaje por voz"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10v2a7 7 0 0014 0v-2" />
                    <path d="M12 19v3" />
                    <path d="M8 22h8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <style jsx>{`
        .nl-service-header {
          left: calc(var(--sidebar-w) + 24px);
          right: 24px;
        }

        @media (max-width: 768px) {
          .nl-service-header {
            left: 24px;
            right: 24px;
          }
        }

        .nl-chat-bubble {
          animation: nl-pop 0.2s ease;
        }

        @keyframes nl-pop {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

      `}</style>
    </div>
  );
}
