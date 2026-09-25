import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Importando o contexto de autenticação

type Mode = "login" | "register";

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

  const fillDemo = (type: "user" | "admin") => {
    setEmail(type === "admin" ? "admin@brio.app" : "demo@brio.app");
    setPassword(type === "admin" ? "admin123" : "demo123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_hsl(250_85%_65%/0.35)]"
          >
            <Zap className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-heading font-black text-foreground tracking-tight">BRIO</h1>
          <p className="text-muted-foreground text-sm mt-1">Foco, disciplina e constância</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-1">
              <h2 className="text-xl font-heading font-bold text-foreground">
                {mode === "login" ? "Que bom ver você novamente" : "Comece sua jornada"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "login"
                  ? "Entre para continuar evoluindo sua produtividade."
                  : "Crie sua conta e transforme seus objetivos em progresso."}
              </p>
            </div>
            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="name" className="text-xs font-medium text-muted-foreground block mb-1.5">Nome completo</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    minLength={2}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="email" className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-medium text-muted-foreground block mb-1.5">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Sua senha"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 pr-11 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="confirm-password" className="text-xs font-medium text-muted-foreground block mb-1.5">
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
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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
                  className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2.5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-accent bg-accent/10 border border-accent/20 rounded-xl px-3 py-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_hsl(250_85%_65%/0.25)] hover:shadow-[0_0_30px_hsl(250_85%_65%/0.4)]"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  {mode === "login" ? "Entrar na plataforma" : "Criar minha conta"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === "login" && (
            <div className="mt-5">
              <p className="text-xs text-muted-foreground text-center mb-3">Acesso rápido para teste:</p>
              <button
                onClick={() => fillDemo("user")}
                className="w-full py-2 text-xs bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                Demo Usuário
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          BRIO — Foco, disciplina e constância
        </p>
        <p className="text-center text-xs mt-2">
          <Link to="/admin/login" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Acesso administrativo
          </Link>
        </p>
      </motion.div>
    </div>
  );
}