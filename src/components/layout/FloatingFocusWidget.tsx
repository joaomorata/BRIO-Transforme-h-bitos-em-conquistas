import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Play, Pause, Timer as TimerIcon } from "lucide-react";
import { useFocus, FOCUS_MODES } from "@/context/FocusContext";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FloatingFocusWidget() {
  const { mode, timeLeft, isRunning, hasActiveSession, start, pause } = useFocus();
  const location = useLocation();

  // Na própria página de Foco o timer grande já aparece — não precisa do mini-widget por cima.
  const onPomodoroPage = location.pathname === "/pomodoro";
  const visible = hasActiveSession && !onPomodoroPage;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-3 bg-card border border-border rounded-2xl shadow-2xl pl-4 pr-2 py-2"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <Link to="/pomodoro" className="flex items-center gap-2.5">
            <TimerIcon className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-mono font-bold text-foreground leading-none">{formatTime(timeLeft)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{FOCUS_MODES[mode].label}</p>
            </div>
          </Link>
          <button
            onClick={() => (isRunning ? pause() : start())}
            aria-label={isRunning ? "Pausar" : "Retomar"}
            className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground transition-colors shrink-0"
          >
            {isRunning ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
