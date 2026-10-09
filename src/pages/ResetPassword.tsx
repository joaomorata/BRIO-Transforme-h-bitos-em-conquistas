import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Zap, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const EASE = [0.16, 1, 0.3, 1] as const;

type LinkStatus = "checking" | "valid" | "invalid";

export default function ResetPassword() {
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const { updatePasswordWithRecovery } = useAuth();

  // O Supabase cria a sessão de recuperação de forma assíncrona a partir do
  // token que vem na URL do link do e-mail. Por isso checamos a sessão atual
  // e também escutamos o evento PASSWORD_RECOVERY, em vez de assumir que ela
  // já existe no primeiro render.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setLinkStatus("valid");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) setLinkStatus("valid");
    });

    const timeout = setTimeout(() => {
      if (mounted) setLinkStatus((prev) => (prev === "checking" ? "invalid" : prev));
    }, 2500);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const result = await updatePasswordWithRecovery(password);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } else {
      setError(result.error || "Não foi possível redefinir a senha.");
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

        {linkStatus === "checking" && (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <motion.span
              className="block h-4 w-4 rounded-full border-2 border-border border-t-foreground"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
            />
            Verificando o link...
          </div>
        )}

        {linkStatus === "invalid" && (
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.25, ease: EASE }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground">
              Link inválido ou expirado
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Esse link de redefinição não é mais válido. Peça um novo para continuar.
            </p>
            <Link
              to="/esqueci-senha"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Pedir novo link
            </Link>
          </motion.div>
        )}

        {linkStatus === "valid" && (
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.25, ease: EASE }}
          >
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Defina uma nova senha
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Escolha uma senha com pelo menos 8 caracteres.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="password" className="text-sm text-muted-foreground">
                  Nova senha
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute bottom-2.5 left-0 h-4 w-4 text-muted-foreground/60" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    autoFocus
                    required
                    className="w-full border-0 border-b-2 border-border bg-transparent py-2 pl-6 pr-7 text-[15px] text-foreground placeholder-muted-foreground/60 outline-none transition-colors focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute bottom-1.5 right-0 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="text-sm text-muted-foreground">
                  Confirmar nova senha
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute bottom-2.5 left-0 h-4 w-4 text-muted-foreground/60" />
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
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
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-3 py-2.5 text-accent"
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">Senha redefinida! Entrando...</p>
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
                  "Salvar nova senha"
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
