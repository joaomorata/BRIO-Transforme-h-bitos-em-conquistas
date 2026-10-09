import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Zap, Mail, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestPasswordReset(email);

    setLoading(false);

    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || "Não foi possível enviar o link. Tente novamente.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">BRIO</span>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.25, ease: EASE }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle2 className="h-5 w-5 text-accent" />
              </div>
              <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground">
                Link enviado
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enviamos um link de redefinição para <span className="text-foreground">{email}</span>.
                Verifique sua caixa de entrada (e o spam) — ele expira em alguns minutos.
              </p>

              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-6 text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                Não recebeu? Enviar novamente
              </button>

              <Link
                to="/login"
                className="mt-8 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar para o login
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.25, ease: EASE }}
            >
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Esqueceu sua senha?
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Digite seu e-mail e enviaremos um link para você criar uma nova senha.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="email" className="text-sm text-muted-foreground">
                    Email
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute bottom-2.5 left-0 h-4 w-4 text-muted-foreground/60" />
                    <input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                      required
                      className="w-full border-0 border-b-2 border-border bg-transparent py-2 pl-6 text-[15px] text-foreground placeholder-muted-foreground/60 outline-none transition-colors focus:border-primary"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-destructive"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={prefersReducedMotion || loading ? undefined : { y: -1 }}
                  whileTap={prefersReducedMotion || loading ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.15, ease: EASE }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <motion.span
                      className="block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                    />
                  ) : (
                    "Enviar link de redefinição"
                  )}
                </motion.button>
              </form>

              <Link
                to="/login"
                className="mt-8 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar para o login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
