import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";

export const FOCUS_MODES = {
  focus: { label: "Foco", duration: 25 * 60 },
  shortBreak: { label: "Pausa Curta", duration: 5 * 60 },
  longBreak: { label: "Pausa Longa", duration: 15 * 60 },
} as const;

export type FocusModeKey = keyof typeof FOCUS_MODES;

interface FocusSession {
  mode: FocusModeKey;
  // Quanto faltava quando essa "corrida" começou (ao dar play ou resumir).
  remainingAtStart: number;
  // Quando essa corrida começou, em epoch ms. Só importa enquanto isRunning.
  startedAt: number;
  isRunning: boolean;
  pomodoroCount: number;
}

interface FocusContextType {
  mode: FocusModeKey;
  timeLeft: number;
  isRunning: boolean;
  pomodoroCount: number;
  hasActiveSession: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  switchMode: (mode: FocusModeKey) => void;
  justCompletedFocus: boolean;
  dismissCompletion: () => void;
}

const FocusContext = createContext<FocusContextType | null>(null);

function sessionKey(userId: string | null) {
  return userId ? `brio_focus_session_${userId}` : "brio_focus_session_guest";
}

function readSession(userId: string | null): FocusSession {
  try {
    const raw = localStorage.getItem(sessionKey(userId));
    if (raw) return JSON.parse(raw);
  } catch {
    // ignora cache corrompido
  }
  return { mode: "focus", remainingAtStart: FOCUS_MODES.focus.duration, startedAt: Date.now(), isRunning: false, pomodoroCount: 0 };
}

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { addPomodoro } = useApp();
  const userId = user?.id ?? null;

  const [session, setSession] = useState<FocusSession>(() => readSession(userId));
  const [now, setNow] = useState(() => Date.now());
  const [justCompletedFocus, setJustCompletedFocus] = useState(false);

  // Troca de conta no mesmo navegador: recarrega a sessão certa.
  useEffect(() => {
    setSession(readSession(userId));
  }, [userId]);

  // Persiste a cada mudança — é isso que sobrevive a um F5 ou troca de página.
  useEffect(() => {
    try {
      localStorage.setItem(sessionKey(userId), JSON.stringify(session));
    } catch {
      // localStorage indisponível: segue só em memória
    }
  }, [session, userId]);

  // Só gasta CPU recalculando a cada segundo enquanto o timer está rodando —
  // parado, não tem motivo pra re-render nenhum.
  useEffect(() => {
    if (!session.isRunning) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session.isRunning]);

  const timeLeft = session.isRunning
    ? Math.max(0, session.remainingAtStart - Math.floor((now - session.startedAt) / 1000))
    : session.remainingAtStart;

  // Guarda contra disparar a conclusão mais de uma vez pro mesmo término.
  const handledEndRef = useRef(false);

  const switchMode = useCallback((mode: FocusModeKey) => {
    handledEndRef.current = false;
    setSession((prev) => ({ ...prev, mode, remainingAtStart: FOCUS_MODES[mode].duration, startedAt: Date.now(), isRunning: false }));
  }, []);

  const start = useCallback(() => {
    handledEndRef.current = false;
    setSession((prev) => ({ ...prev, startedAt: Date.now(), isRunning: true }));
  }, []);

  const pause = useCallback(() => {
    setSession((prev) => {
      if (!prev.isRunning) return prev;
      const frozen = Math.max(0, prev.remainingAtStart - Math.floor((Date.now() - prev.startedAt) / 1000));
      return { ...prev, remainingAtStart: frozen, isRunning: false };
    });
  }, []);

  const resume = useCallback(() => {
    handledEndRef.current = false;
    setSession((prev) => ({ ...prev, startedAt: Date.now(), isRunning: true }));
  }, []);

  const reset = useCallback(() => {
    handledEndRef.current = false;
    setSession((prev) => ({ ...prev, remainingAtStart: FOCUS_MODES[prev.mode].duration, isRunning: false }));
  }, []);

  // Dispara quando o tempo zera — funciona em qualquer página, mesmo que o
  // usuário tenha saído da tela de Foco (ou até recarregado) nesse meio tempo.
  useEffect(() => {
    if (!session.isRunning || timeLeft > 0 || handledEndRef.current) return;
    handledEndRef.current = true;

    if (session.mode === "focus") {
      const newCount = session.pomodoroCount + 1;
      addPomodoro();
      setJustCompletedFocus(true);
      const nextMode: FocusModeKey = newCount % 4 === 0 ? "longBreak" : "shortBreak";
      setSession({ mode: nextMode, remainingAtStart: FOCUS_MODES[nextMode].duration, startedAt: Date.now(), isRunning: false, pomodoroCount: newCount });
    } else {
      setSession((prev) => ({ ...prev, mode: "focus", remainingAtStart: FOCUS_MODES.focus.duration, startedAt: Date.now(), isRunning: false }));
    }
  }, [timeLeft, session.isRunning, session.mode, session.pomodoroCount, addPomodoro]);

  const dismissCompletion = useCallback(() => setJustCompletedFocus(false), []);

  const hasActiveSession = session.isRunning || session.remainingAtStart < FOCUS_MODES[session.mode].duration;

  return (
    <FocusContext.Provider
      value={{
        mode: session.mode,
        timeLeft,
        isRunning: session.isRunning,
        pomodoroCount: session.pomodoroCount,
        hasActiveSession,
        start,
        pause,
        resume,
        reset,
        switchMode,
        justCompletedFocus,
        dismissCompletion,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used within FocusProvider");
  return ctx;
}
