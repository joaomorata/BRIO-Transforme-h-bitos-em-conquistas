import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || "Erro inesperado.");
      setLoading(false);
      return;
    }

    // O login usa o mesmo sistema de autenticação do BRIO (Supabase Auth) —
<<<<<<< HEAD
    // a diferença é que essa tela exige que a conta esteja cadastrada na
    // tabela `admins` (protegida, ninguém consegue se autopromover a admin
    // sozinho). Contas comuns são recusadas e deslogadas na hora, mesmo com
    // senha certa.
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setError("Não foi possível confirmar a sessão.");
      setLoading(false);
      return;
    }

    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (!adminRow) {
=======
    // a diferença é que essa tela exige que a conta esteja marcada como
    // administradora (role "admin" nos metadados do usuário no Supabase).
    // Contas comuns são recusadas e deslogadas na hora, mesmo com senha certa.
    const { data } = await supabase.auth.getUser();
    const role = data.user?.user_metadata?.role;

    if (role !== "admin") {
>>>>>>> 3239e0440856565940536f3ef89c6a821d8a4437
      await supabase.auth.signOut();
      setError("Esta conta não tem permissão de administrador.");
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/6 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Acesso administrativo</h1>
          <p className="text-sm text-muted-foreground mt-1">Área restrita do BRIO</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="text-xs font-medium text-muted-foreground block mb-1.5">
              E-mail
            </label>
            <input
              id="admin-email"
              type="email"
              placeholder="admin@brio.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="text-xs font-medium text-muted-foreground block mb-1.5">
              Senha
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                Entrar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Esta é uma porta de acesso separada da área de usuários comuns.
        </p>
      </motion.div>
    </div>
  );
}
