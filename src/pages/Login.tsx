import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Zap,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Flame,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Importando o contexto de autenticação

type Mode = "login" | "register";

const EASE = [0.16, 1, 0.3, 1] as const;

// Intensidade de foco dos últimos 35 dias (0 = nada, 3 = dia cheio) — ilustrativo,
// a mesma ideia da sequência (streak) usada de verdade no Dashboard. Último valor
// é "hoje".
const STREAK_DAYS = [
  0, 0, 1, 0, 2, 0, 1,
  1, 2, 1, 0, 2, 2, 1,
  2, 1, 3, 2, 1, 3, 2,
  3, 2, 3, 3, 2, 3, 3,
  3, 3, 2, 3, 3, 3, 3,
];
const INTENSITY_CLASS: Record<number, string> = {
  0: "bg-border/50",
  1: "bg-primary/25",
  2: "bg-primary/55",
  3: "bg-primary/90",
};

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    let result: { success: boolean; error?: string } = { success: false };

    if (mode === "login") {
      result = await login(email, password);
    } else {
      // Validações do Cadastro
      if (!name.trim()) {
        setError("Informe seu nome.");
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError("A senha deve ter pelo menos 8 caracteres.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        setLoading(false);
        return;
      }

      result = await register(name, email, password);
    }

    setLoading(false);

    if (result.success) {
      setSuccess(mode === "login" ? "Bem-vindo de volta!" : "Conta criada com sucesso!");

      // Espera 1.5 segundos exibindo a mensagem verde de sucesso e joga para dentro do site
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } else {
      setError(result.error || "Erro inesperado.");
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setSuccess("");
  };

  const fillDemo = (type: "user" | "admin") => {
    setEmail(type === "admin" ? "admin@brio.app" : "demo@brio.app");
    setPassword(type === "admin" ? "admin123" : "demo1234");
    setError("");
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Painel de marca — a sequência de foco, a métrica que o BRIO existe para construir.
          Só aparece a partir de telas grandes; no celular ele tomava a tela toda e
          empurrava o formulário (a ação que importa) para fora da primeira dobra. */}
      <div className="hidden lg:flex lg:flex-col bg-[hsl(230_30%_5%)] px-8 py-10 sm:px-12 lg:min-h-screen lg:px-16 lg:py-14">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">BRIO</span>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-10 py-12 lg:py-0">
          <div
            className="grid w-64 grid-cols-7 gap-1.5 sm:w-72"
            role="img"
            aria-label="Mapa de constância dos últimos 35 dias, a maior parte dos dias recentes com foco registrado"
          >
            {STREAK_DAYS.map((intensity, i) => {
              const isToday = i === STREAK_DAYS.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.01 : 0.25,
                    delay: prefersReducedMotion ? 0 : 0.25 + i * 0.012,
                    ease: EASE,
                  }}
                  className={`aspect-square rounded-[4px] ${INTENSITY_CLASS[intensity]} ${
                    isToday ? "ring-2 ring-accent ring-offset-2 ring-offset-[hsl(230_30%_5%)]" : ""
                  }`}
                />
              );
            })}
          </div>

          <div>
            <span className="font-heading text-6xl font-black leading-none tracking-tight text-foreground lg:text-7xl">
              23
            </span>
            <p className="mt-2 text-sm text-muted-foreground">dias seguidos de foco</p>
          </div>
        </div>

        <div>
          <p className="font-heading text-2xl font-black leading-tight tracking-tight text-foreground lg:text-3xl">
            Foco, disciplina
            <br />e constância.
          </p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Os últimos 35 dias da sua constância, um quadrado por dia.
          </p>
        </div>
      </div>

      {/* Topo compacto — só no celular, no lugar do painel de marca inteiro */}
      <div className="flex items-center justify-between px-6 pb-6 pt-8 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.25} />
          </div>
          <span className="font-heading text-base font-bold tracking-tight text-foreground">BRIO</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-accent" />
          <span>
            <span className="font-mono font-semibold text-foreground">23</span> dias
          </span>
        </div>
      </div>

      {/* Painel do formulário */}
      <div className="flex items-center justify-center px-6 pb-12 pt-2 sm:px-10 lg:px-16 lg:py-12">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.22, ease: EASE }}
            >
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Entre para continuar sua sequência de foco."
                  : "Comece a construir sua disciplina hoje."}
              </p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.22, ease: EASE }}
                >
                  <label htmlFor="name" className="text-sm text-muted-foreground">
                    Nome completo
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    minLength={2}
                    className="mt-1.5 w-full border-0 border-b-2 border-border bg-transparent py-2 text-[15px] text-foreground placeholder-muted-foreground/60 outline-none transition-colors focus:border-primary"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="email" className="text-sm text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="mt-1.5 w-full border-0 border-b-2 border-border bg-transparent py-2 text-[15px] text-foreground placeholder-muted-foreground/60 outline-none transition-colors focus:border-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm text-muted-foreground">
                  Senha
                </label>
                {mode === "login" && (
                  <Link
                    to="/esqueci-senha"
                    className="text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    Esqueceu a senha?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Sua senha"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  required
                  className="mt-1.5 w-full border-0 border-b-2 border-border bg-transparent py-2 pr-7 text-[15px] text-foreground placeholder-muted-foreground/60 outline-none transition-colors focus:border-primary"
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

            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  key="confirm-password-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.22, ease: EASE }}
                >
                  <label htmlFor="confirm-password" className="text-sm text-muted-foreground">
                    Confirmar senha
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="mt-1.5 w-full border-0 border-b-2 border-border bg-transparent py-2 text-[15px] text-foreground placeholder-muted-foreground/60 outline-none transition-colors focus:border-primary"
                  />
                </motion.div>
              )}
            </AnimatePresence>

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
                  <p className="text-sm">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={prefersReducedMotion || loading ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion || loading ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.15, ease: EASE }}
              className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AnimatePresence mode="wait" initial={false}>
                {loading ? (
                  <motion.span
                    key="spinner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="block"
                  >
                    <motion.span
                      className="block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                    />
                  </motion.span>
                ) : (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    {mode === "login" ? "Entrar na plataforma" : "Criar minha conta"}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            {mode === "login" ? (
              <p className="text-muted-foreground">
                Ainda não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  Criar conta
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Já tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  Entrar
                </button>
              </p>
            )}
          </div>

          {mode === "login" && (
            <motion.button
              type="button"
              onClick={() => fillDemo("user")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.3, duration: 0.3 }}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-xs text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Testar com conta demo
            </motion.button>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground/50">
            <Link to="/admin/login" className="transition-colors hover:text-muted-foreground">
              Acesso administrativo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
