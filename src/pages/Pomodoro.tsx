import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  Coffee,
  ExternalLink,
  Image,
  Link2,
  Maximize2,
  Minimize2,
  Music2,
  Pause,
  Plus,
  Play,
  RotateCcw,
  Settings2,
  Timer,
  Trash2,
  Youtube,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import EnergyPicker from "@/components/dashboard/EnergyPicker";
import { cn } from "@/lib/utils";

const MODES = {
  focus: { label: "Foco", duration: 25 * 60, color: "text-primary" },
  shortBreak: { label: "Pausa Curta", duration: 5 * 60, color: "text-accent" },
  longBreak: { label: "Pausa Longa", duration: 15 * 60, color: "text-pink-400" },
};

type ModeKey = keyof typeof MODES;

type BackgroundChoice = "lofi" | "study" | "custom";

const BACKGROUNDS = {
  lofi: {
    label: "Lofi",
    description: "Luzes baixas, ritmo macio",
    fallback:
      "radial-gradient(circle at 18% 18%, hsl(270 42% 25% / 0.72), transparent 32%), radial-gradient(circle at 84% 78%, hsl(176 48% 19% / 0.4), transparent 28%), linear-gradient(135deg, hsl(231 29% 8%), hsl(252 28% 13%) 52%, hsl(184 28% 9%))",
  },
  study: {
    label: "Estudo",
    description: "Clareza para sessões densas",
    fallback:
      "radial-gradient(circle at 78% 12%, hsl(176 54% 24% / 0.55), transparent 30%), radial-gradient(circle at 12% 88%, hsl(43 63% 21% / 0.35), transparent 34%), linear-gradient(135deg, hsl(220 28% 8%), hsl(205 28% 13%) 52%, hsl(174 25% 10%))",
  },
};

type SavedYoutubeLink = {
  title: string;
  url: string;
  detail?: string;
  duration?: string;
};

const DEFAULT_YOUTUBE_SESSIONS: SavedYoutubeLink[] = [
  {
    title: "Lofi Girl · beats to relax/study to",
    detail: "Instrumental contínuo para entrar no ritmo",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    duration: "ao vivo",
  },
  {
    title: "Deep Focus · música para concentração",
    detail: "Paisagens sonoras sem vocal para sessões longas",
    url: "https://www.youtube.com/watch?v=6JkxV8jF3g4",
    duration: "playlist",
  },
  {
    title: "Rainy day coffee shop ambience",
    detail: "Chuva leve, café e um pouco de silêncio",
    url: "https://www.youtube.com/watch?v=2OEL4P1Rz04",
    duration: "ambiente",
  },
];

const SPOTIFY_SHORTCUTS = [
  {
    label: "Deep Focus",
    id: "37i9dQZF1DWZeKCadgRdKQ",
  },
  {
    label: "Lofi Beats",
    id: "37i9dQZF1DWWQRwui0ExPn",
  },
  {
    label: "Peaceful Piano",
    id: "37i9dQZF1DX4sWSpwq3LiO",
  },
];

function readStorage(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function getSpotifyEmbedUrl(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.hostname !== "open.spotify.com") return "";
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0]?.startsWith("intl-")) parts.shift();
    const embedIndex = parts[0] === "embed" ? 1 : 0;
    const type = parts[embedIndex];
    const id = parts[embedIndex + 1];
    const validTypes = ["album", "artist", "episode", "playlist", "show", "track"];
    if (!type || !id || !validTypes.includes(type)) return "";
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  } catch {
    return "";
  }
}

function isValidYoutubeUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"].includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function getStoredBackgroundChoice(): BackgroundChoice {
  const value = readStorage("brio_pomodoro_background", "lofi");
  return value === "study" || value === "custom" ? value : "lofi";
}

export default function Pomodoro() {
  const [mode, setMode] = useState<ModeKey>("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [preFocusEnergy, setPreFocusEnergy] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [showPostFocusPrompt, setShowPostFocusPrompt] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mediaTab, setMediaTab] = useState<"spotify" | "youtube">("spotify");
  const [backgroundChoice, setBackgroundChoice] = useState<BackgroundChoice>(
    getStoredBackgroundChoice
  );
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState(() =>
    readStorage("brio_pomodoro_custom_background", "")
  );
  const [customUrlDraft, setCustomUrlDraft] = useState(() =>
    readStorage("brio_pomodoro_custom_background", "")
  );
  const [backgroundError, setBackgroundError] = useState("");
  const [isBackgroundSettingsOpen, setIsBackgroundSettingsOpen] = useState(false);
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState(() =>
    readStorage(
      "brio_pomodoro_spotify",
      "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0"
    )
  );
  const [spotifyUrlDraft, setSpotifyUrlDraft] = useState("");
  const [spotifyError, setSpotifyError] = useState("");
  const [customYoutubeLinks, setCustomYoutubeLinks] = useState<SavedYoutubeLink[]>(() => {
    try {
      const raw = readStorage("brio_pomodoro_youtube_links", "[]");
      const parsed = JSON.parse(raw) as SavedYoutubeLink[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [youtubeTitleDraft, setYoutubeTitleDraft] = useState("");
  const [youtubeUrlDraft, setYoutubeUrlDraft] = useState("");
  const [youtubeError, setYoutubeError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addPomodoro, stats, logMood } = useApp();

  const currentMode = MODES[mode];
  const progress = ((currentMode.duration - timeLeft) / currentMode.duration) * 100;

  const switchMode = useCallback((newMode: ModeKey) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
    if (newMode === "focus") setPreFocusEnergy(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isRunning) return undefined;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || timeLeft !== 0) return;
    setIsRunning(false);
    if (mode === "focus") {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      addPomodoro();
      setShowPostFocusPrompt(true);
      switchMode(newCount % 4 === 0 ? "longBreak" : "shortBreak");
    } else {
      switchMode("focus");
    }
  }, [timeLeft, isRunning, mode, pomodoroCount, addPomodoro, switchMode]);

  useEffect(() => {
    window.localStorage.setItem("brio_pomodoro_background", backgroundChoice);
  }, [backgroundChoice]);

  useEffect(() => {
    window.localStorage.setItem("brio_pomodoro_custom_background", customBackgroundUrl);
  }, [customBackgroundUrl]);

  useEffect(() => {
    window.localStorage.setItem("brio_pomodoro_spotify", spotifyEmbedUrl);
  }, [spotifyEmbedUrl]);

  useEffect(() => {
    window.localStorage.setItem("brio_pomodoro_youtube_links", JSON.stringify(customYoutubeLinks));
  }, [customYoutubeLinks]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const customBackgroundImage = isValidHttpUrl(customBackgroundUrl)
    ? `url("${customBackgroundUrl.replace(/"/g, "%22")}")`
    : "";
  const pageBackground =
    backgroundChoice === "custom" && customBackgroundImage
      ? customBackgroundImage
      : BACKGROUNDS[backgroundChoice === "custom" ? "lofi" : backgroundChoice].fallback;

  const youtubeSessions = [
    ...DEFAULT_YOUTUBE_SESSIONS,
    ...customYoutubeLinks.map((link) => ({
      ...link,
      detail: "Link salvo por você",
      duration: "salvo",
    })),
  ];

  const handleBackgroundSelect = (choice: Exclude<BackgroundChoice, "custom">) => {
    setBackgroundChoice(choice);
    setBackgroundError("");
  };

  const handleCustomBackgroundSave = () => {
    const trimmedUrl = customUrlDraft.trim();
    if (!isValidHttpUrl(trimmedUrl)) {
      setBackgroundError("Cole uma URL válida começando com http:// ou https://.");
      return;
    }
    setCustomBackgroundUrl(trimmedUrl);
    setBackgroundChoice("custom");
    setBackgroundError("");
  };

  const handleSpotifyShortcut = (id: string) => {
    setSpotifyEmbedUrl(`https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`);
    setSpotifyUrlDraft("");
    setSpotifyError("");
  };

  const handleSpotifySave = () => {
    const embedUrl = getSpotifyEmbedUrl(spotifyUrlDraft.trim());
    if (!embedUrl) {
      setSpotifyError("Cole um link válido de playlist, álbum, faixa ou artista do Spotify.");
      return;
    }
    setSpotifyEmbedUrl(embedUrl);
    setSpotifyUrlDraft("");
    setSpotifyError("");
  };

  const handleYoutubeSave = () => {
    const title = youtubeTitleDraft.trim() || "Sessão de estudo salva";
    const url = youtubeUrlDraft.trim();
    if (!isValidYoutubeUrl(url)) {
      setYoutubeError("Cole um link válido do YouTube.");
      return;
    }
    setCustomYoutubeLinks((links) => [...links, { title, url }]);
    setYoutubeTitleDraft("");
    setYoutubeUrlDraft("");
    setYoutubeError("");
  };

  const removeYoutubeLink = (url: string) => {
    setCustomYoutubeLinks((links) => links.filter((link) => link.url !== url));
  };

  const resetTimer = () => {
    setTimeLeft(currentMode.duration);
    setIsRunning(false);
  };

  const renderTimer = (compact = false) => (
    <div className={cn("relative", compact ? "h-16 w-16" : "h-72 w-72 md:h-80 md:w-80")}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 300 300" aria-hidden="true">
        <circle
          cx="150"
          cy="150"
          r="140"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={compact ? "10" : "6"}
        />
        <motion.circle
          cx="150"
          cy="150"
          r="140"
          fill="none"
          stroke={mode === "focus" ? "hsl(250 85% 65%)" : "hsl(175 80% 50%)"}
          strokeWidth={compact ? "10" : "6"}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      {!compact && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-6xl font-bold tracking-tight text-foreground md:text-7xl"
            data-testid="text-timer"
            aria-live="polite"
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className={cn("mt-2 text-sm font-medium", currentMode.color)} data-testid="text-current-mode">
            {currentMode.label}
          </span>
        </div>
      )}
    </div>
  );

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="fixed bottom-6 right-6 z-50 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-primary/25 bg-card/95 p-3 shadow-2xl shadow-primary/10 backdrop-blur-xl"
        role="region"
        aria-label="Widget minimizado do Pomodoro"
        data-testid="pomodoro-minimized-widget"
      >
        <div className="flex items-center gap-3">
          {renderTimer(true)}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {currentMode.label}
            </p>
            <p className="font-mono text-2xl font-bold text-foreground" data-testid="text-widget-timer">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsRunning((running) => !running)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={isRunning ? "Pausar Pomodoro" : "Iniciar Pomodoro"}
              data-testid="button-widget-toggle"
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={resetTimer}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Reiniciar Pomodoro"
              data-testid="button-widget-reset"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Expandir Pomodoro"
              data-testid="button-widget-expand"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className="relative isolate min-h-full overflow-hidden rounded-3xl p-4 transition-[background-image] duration-500 sm:p-6 lg:p-8"
      style={{ backgroundImage: pageBackground, backgroundSize: "cover", backgroundAttachment: "fixed" }}
      data-testid="pomodoro-page"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/50 backdrop-blur-xs" />
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Ritual de foco
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Um intervalo só seu.
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Escolha um ritmo, tire o ruído do caminho e deixe o próximo bloco fazer o trabalho.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsBackgroundSettingsOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/70 px-3 py-2 text-sm font-medium text-muted-foreground backdrop-blur-md transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Personalizar plano de fundo"
              data-testid="button-open-background-settings"
            >
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Ambiente</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/70 px-3 py-2 text-sm font-medium text-muted-foreground backdrop-blur-md transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Minimizar Pomodoro para widget flutuante"
              data-testid="button-minimize-pomodoro"
            >
              <Minimize2 className="h-4 w-4" />
              <span className="hidden sm:inline">Minimizar</span>
            </button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.6fr)]">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border/80 bg-card/75 p-5 shadow-2xl shadow-background/20 backdrop-blur-xl sm:p-8"
            aria-label="Temporizador Pomodoro"
            data-testid="card-pomodoro-timer"
          >
            <div className="flex flex-col items-center">
              <div className="mb-7 flex flex-wrap justify-center gap-2">
                {(Object.entries(MODES) as [ModeKey, typeof MODES[ModeKey]][]).map(([key, m]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => switchMode(key)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      mode === key
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "border border-border bg-background/35 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    aria-pressed={mode === key}
                    data-testid={`button-mode-${key}`}
                  >
                    {key === "focus" ? <Timer className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
                    {m.label}
                  </button>
                ))}
              </div>

              {renderTimer()}

              <div className="mt-8 flex justify-center gap-3">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background/40 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={resetTimer}
                  aria-label="Reiniciar temporizador"
                  data-testid="button-reset-timer"
                >
                  <RotateCcw className="h-5 w-5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex h-12 items-center gap-2 rounded-xl px-10 text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isRunning
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => setIsRunning((running) => !running)}
                  aria-label={isRunning ? "Pausar temporizador" : "Iniciar temporizador"}
                  data-testid="button-toggle-timer"
                >
                  {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isRunning ? "Pausar" : "Iniciar"}
                </button>
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-border/70 bg-background/30 px-5 py-3" data-testid="status-pomodoro-count">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Sessões nesta visita</span>
                <span className="font-mono text-lg font-bold text-foreground" data-testid="text-pomodoro-count">
                  {pomodoroCount}
                </span>
              </div>

              {mode === "focus" && !isRunning && timeLeft === MODES.focus.duration && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground">Antes de começar, como está sua energia?</span>
                  <EnergyPicker
                    selected={preFocusEnergy}
                    onSelect={(value) => {
                      setPreFocusEnergy(value);
                      logMood(value, "pre_focus");
                    }}
                  />
                </div>
              )}
            </div>
          </motion.section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-border/80 bg-card/70 p-5 backdrop-blur-xl" data-testid="card-focus-note">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Agora</p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">Só o próximo passo.</h2>
                </div>
                <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
                  <Music2 className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p>O bloco atual tem {Math.round(currentMode.duration / 60)} minutos. Não precisa resolver tudo agora.</p>
                <div className="flex items-center justify-between border-t border-border/70 pt-4">
                  <span>Foco acumulado</span>
                  <span className="font-mono font-semibold text-foreground" data-testid="text-total-focus-minutes">
                    {stats.total_focus_minutes} min
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border/80 bg-card/70 p-5 backdrop-blur-xl" data-testid="card-session-guide">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Cadência sugerida</p>
              <div className="mt-4 flex items-center gap-2" aria-label="Quatro sessões de foco e uma pausa longa">
                {[1, 2, 3, 4].map((session) => (
                  <div
                    key={session}
                    className={cn(
                      "h-2 flex-1 rounded-full",
                      session <= pomodoroCount % 4 || (pomodoroCount > 0 && pomodoroCount % 4 === 0)
                        ? "bg-primary"
                        : "bg-secondary"
                    )}
                    data-testid={`indicator-session-${session}`}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>4 blocos</span>
                <span>Pausa longa</span>
              </div>
            </section>
          </aside>
        </div>

        <section className="rounded-3xl border border-border/80 bg-card/75 p-5 backdrop-blur-xl sm:p-6" data-testid="card-media-center">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                <Music2 className="h-3.5 w-3.5" />
                Central de mídia
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Som para ficar.</h2>
              <p className="mt-1 text-sm text-muted-foreground">Uma trilha discreta ou um ambiente inteiro, sem trocar de aba.</p>
            </div>
            <div className="flex rounded-xl border border-border bg-background/35 p-1" role="tablist" aria-label="Fonte de mídia">
              <button
                type="button"
                role="tab"
                aria-selected={mediaTab === "spotify"}
                onClick={() => setMediaTab("spotify")}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  mediaTab === "spotify" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                data-testid="button-media-tab-spotify"
              >
                Spotify
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mediaTab === "youtube"}
                onClick={() => setMediaTab("youtube")}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  mediaTab === "youtube" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                data-testid="button-media-tab-youtube"
              >
                <Youtube className="h-4 w-4" />
                YouTube
              </button>
            </div>
          </div>

          {mediaTab === "spotify" ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/40">
                <iframe
                  title="Playlist Spotify para foco"
                  src={spotifyEmbedUrl}
                  className="h-[152px] w-full"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  data-testid="iframe-spotify-player"
                />
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Atalhos Spotify</p>
                <div className="mt-3 flex flex-wrap gap-2 lg:flex-col">
                  {SPOTIFY_SHORTCUTS.map((shortcut) => (
                    <button
                      key={shortcut.id}
                      type="button"
                      onClick={() => handleSpotifyShortcut(shortcut.id)}
                      className="rounded-lg border border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-testid={`button-spotify-shortcut-${shortcut.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 border-t border-border/70 pt-4">
                  <label htmlFor="spotify-url" className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Link2 className="h-3.5 w-3.5 text-accent" />
                    Usar meu link
                  </label>
                  <input
                    id="spotify-url"
                    type="url"
                    value={spotifyUrlDraft}
                    onChange={(event) => {
                      setSpotifyUrlDraft(event.target.value);
                      if (spotifyError) setSpotifyError("");
                    }}
                    placeholder="Link do Spotify"
                    className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    aria-invalid={Boolean(spotifyError)}
                    data-testid="input-spotify-url"
                  />
                  <button
                    type="button"
                    onClick={handleSpotifySave}
                    className="mt-2 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-testid="button-save-spotify-url"
                  >
                    Carregar link
                  </button>
                  {spotifyError && (
                    <p className="mt-2 text-xs leading-4 text-destructive" role="alert" data-testid="status-spotify-error">
                      {spotifyError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div role="tabpanel" data-testid="panel-youtube-sessions">
              <div className="rounded-2xl border border-border/70 bg-background/35 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Plus className="h-3.5 w-3.5 text-accent" />
                  Salvar link rápido
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-[minmax(10rem,0.7fr)_minmax(15rem,1.3fr)_auto]">
                  <input
                    type="text"
                    value={youtubeTitleDraft}
                    onChange={(event) => {
                      setYoutubeTitleDraft(event.target.value);
                      if (youtubeError) setYoutubeError("");
                    }}
                    placeholder="Nome da sessão"
                    className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    aria-label="Nome do link do YouTube"
                    data-testid="input-youtube-title"
                  />
                  <input
                    type="url"
                    value={youtubeUrlDraft}
                    onChange={(event) => {
                      setYoutubeUrlDraft(event.target.value);
                      if (youtubeError) setYoutubeError("");
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                    className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    aria-label="Link do YouTube"
                    aria-invalid={Boolean(youtubeError)}
                    data-testid="input-youtube-url"
                  />
                  <button
                    type="button"
                    onClick={handleYoutubeSave}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-testid="button-save-youtube-link"
                  >
                    <Plus className="h-4 w-4" />
                    Salvar
                  </button>
                </div>
                {youtubeError && (
                  <p className="mt-2 text-xs font-medium text-destructive" role="alert" data-testid="status-youtube-error">
                    {youtubeError}
                  </p>
                )}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3" data-testid="youtube-links-list">
                {youtubeSessions.map((session, index) => {
                  const isCustom = index >= DEFAULT_YOUTUBE_SESSIONS.length;
                  return (
                    <div
                      key={`${session.url}-${index}`}
                      className="group rounded-2xl border border-border/70 bg-background/35 p-4 transition-colors hover:border-primary/50 hover:bg-secondary/60"
                      data-testid={`card-youtube-session-${index + 1}`}
                    >
                      <a
                        href={session.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        data-testid={`link-youtube-session-${index + 1}`}
                      >
                        <div className="mb-5 flex items-center justify-between text-muted-foreground">
                          <span className="rounded-lg bg-destructive/10 p-2 text-destructive">
                            <Youtube className="h-4 w-4" />
                          </span>
                          <ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </div>
                        <p className="font-medium leading-5 text-foreground">{session.title}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{session.detail}</p>
                        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{session.duration}</p>
                      </a>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => removeYoutubeLink(session.url)}
                          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Remover ${session.title}`}
                          data-testid={`button-remove-youtube-session-${index + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remover
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {isBackgroundSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsBackgroundSettingsOpen(false);
          }}
        >
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg rounded-3xl border border-border bg-card p-5 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="background-dialog-title"
            data-testid="dialog-background-settings"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-accent">
                  <Settings2 className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">Seu ambiente</span>
                </div>
                <h2 id="background-dialog-title" className="text-xl font-semibold text-foreground">Troque a atmosfera.</h2>
                <p className="mt-1 text-sm text-muted-foreground">A escolha fica salva neste dispositivo.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBackgroundSettingsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Fechar personalização do ambiente"
                data-testid="button-close-background-settings"
              >
                <ChevronDown className="h-5 w-5 rotate-180" />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleBackgroundSelect("lofi")}
                className={cn(
                  "relative min-h-28 overflow-hidden rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  backgroundChoice === "lofi" ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                )}
                style={{
                  backgroundImage: BACKGROUNDS.lofi.fallback,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                aria-pressed={backgroundChoice === "lofi"}
                data-testid="button-background-lofi"
              >
                <span className="relative z-10 text-sm font-semibold text-foreground">{BACKGROUNDS.lofi.label}</span>
                <span className="relative z-10 mt-1 block text-xs text-foreground/65">{BACKGROUNDS.lofi.description}</span>
                {backgroundChoice === "lofi" && <Check className="absolute right-3 top-3 z-10 h-4 w-4 text-accent" />}
              </button>
              <button
                type="button"
                onClick={() => handleBackgroundSelect("study")}
                className={cn(
                  "relative min-h-28 overflow-hidden rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  backgroundChoice === "study" ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                )}
                style={{
                  backgroundImage: BACKGROUNDS.study.fallback,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                aria-pressed={backgroundChoice === "study"}
                data-testid="button-background-study"
              >
                <span className="relative z-10 text-sm font-semibold text-foreground">{BACKGROUNDS.study.label}</span>
                <span className="relative z-10 mt-1 block text-xs text-foreground/65">{BACKGROUNDS.study.description}</span>
                {backgroundChoice === "study" && <Check className="absolute right-3 top-3 z-10 h-4 w-4 text-accent" />}
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-background/35 p-4">
              <label htmlFor="custom-background-url" className="text-sm font-medium text-foreground">URL própria</label>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Use uma imagem http ou https. Ela será aplicada com uma camada escura.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  id="custom-background-url"
                  type="url"
                  value={customUrlDraft}
                  onChange={(event) => {
                    setCustomUrlDraft(event.target.value);
                    if (backgroundError) setBackgroundError("");
                  }}
                  placeholder="https://seu-site.com/imagem.jpg"
                  className="min-w-0 flex-1 rounded-xl border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  aria-invalid={Boolean(backgroundError)}
                  aria-describedby={backgroundError ? "background-url-error" : "background-url-hint"}
                  data-testid="input-custom-background-url"
                />
                <button
                  type="button"
                  onClick={handleCustomBackgroundSave}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  data-testid="button-save-custom-background"
                >
                  Aplicar
                </button>
              </div>
              <p id="background-url-hint" className="mt-2 text-xs text-muted-foreground">A imagem não é enviada: apenas a URL fica no localStorage.</p>
              {backgroundError && (
                <p id="background-url-error" className="mt-2 text-xs font-medium text-destructive" role="alert" data-testid="status-background-url-error">
                  {backgroundError}
                </p>
              )}
            </div>
          </motion.section>
        </div>
      )}

      <AnimatePresence>
        {showPostFocusPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm px-4"
            role="dialog"
            aria-label="Como foi sua sessão de foco"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-foreground">Sessão concluída! 🎉</h3>
              <p className="mt-1 text-sm text-muted-foreground">Como você está se sentindo agora?</p>
              <div className="mt-5 flex justify-center">
                <EnergyPicker
                  onSelect={(value) => {
                    logMood(value, "post_focus");
                    setShowPostFocusPrompt(false);
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPostFocusPrompt(false)}
                className="mt-5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Pular
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
