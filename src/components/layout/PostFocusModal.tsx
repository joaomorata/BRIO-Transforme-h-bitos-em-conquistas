import { motion, AnimatePresence } from "framer-motion";
import { useFocus } from "@/context/FocusContext";
import { useApp } from "@/context/AppContext";
import EnergyPicker from "@/components/dashboard/EnergyPicker";

export default function PostFocusModal() {
  const { justCompletedFocus, dismissCompletion } = useFocus();
  const { logMood } = useApp();

  return (
    <AnimatePresence>
      {justCompletedFocus && (
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
            <h3 className="text-lg font-semibold text-foreground">Sessão concluída!</h3>
            <p className="mt-1 text-sm text-muted-foreground">Como você está se sentindo agora?</p>
            <div className="mt-5 flex justify-center">
              <EnergyPicker
                onSelect={(value) => {
                  logMood(value, "post_focus");
                  dismissCompletion();
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => dismissCompletion()}
              className="mt-5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Pular
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
