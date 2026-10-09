import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const ticker = [
  "Ganhe XP ⚡",
  "Suba de nível 🏆",
  "Foque com Pomodoro ⏱",
  "Complete tarefas ✅",
  "Desbloqueie conquistas 🎖",
  "Acompanhe seu progresso 📈",
  "Seja mais produtivo 🔥",
  "Ganhe XP ⚡",
  "Suba de nível 🏆",
  "Foque com Pomodoro ⏱",
  "Complete tarefas ✅",
  "Desbloqueie conquistas 🎖",
  "Acompanhe seu progresso 📈",
  "Seja mais produtivo 🔥",
];

function Marquee() {
  return (
    <div className="overflow-hidden border-y border-border py-3 my-12 bg-card/30">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {ticker.map((item, i) => (
          <span key={i} className="text-sm text-muted-foreground font-medium shrink-0">
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const before = [
  "Lista de afazeres que você nunca abre",
  "Notificações que você ignora",
  "Reuniões que poderiam ser um e-mail",
  "Produtividade que some às 10h da manhã",
];

const after = [
  "Cada tarefa dá XP real",
  "Você sobe de nível de verdade",
  "Pomodoro com recompensa ao final",
  "Sequências que você não quer perder",
];

export default function Landing() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ─── ANIMATED HERO ─── */}
      <section
        style={{
          background: "#0a0a0f",
          height: "100vh",
          fontFamily: "'Inter', sans-serif",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Grid background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(120,100,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(120,100,255,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1.2 }}
          style={{
            position: "absolute",
            width: 500,
            height: 300,
            background: "radial-gradient(ellipse, rgba(100,80,255,0.22) 0%, transparent 70%)",
            top: -60,
            left: -80,
            pointerEvents: "none",
          }}
        />

        {/* Intro overlay */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              key="intro"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.7, 0, 0.3, 1] }}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 99,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0a0a0f",
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #7c5cfc, #5b3fe8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  ⚡
                </div>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
                  BRIO
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NAV */}
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.5 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 36px",
            borderBottom: "0.5px solid rgba(255,255,255,0.07)",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "linear-gradient(135deg, #7c5cfc, #5b3fe8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
              }}
            >
              ⚡
            </div>
            BRIO
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link
              to="/login"
              style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", padding: "7px 14px", borderRadius: 8, textDecoration: "none" }}
            >
              Entrar
            </Link>
            <Link
              to="/login"
              style={{ background: "#6c47ff", color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 9, textDecoration: "none" }}
            >
              Criar conta
            </Link>
          </div>
        </motion.nav>

        {/* HERO CONTENT */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 48,
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 56px",
            width: "100%",
          }}
        >
          {/* Left */}
          <div style={{ flex: 1, maxWidth: 580 }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.3, duration: 0.5 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(108,71,255,0.15)",
                border: "0.5px solid rgba(108,71,255,0.35)",
                color: "#a68dff",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.8px",
                padding: "6px 14px",
                borderRadius: 20,
                marginBottom: 28,
                textTransform: "uppercase",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c5cfc", display: "inline-block" }} />
              Plataforma de produtividade
            </motion.div>

            {/* Headline */}
            <h1 style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.0, letterSpacing: "-3px", color: "#fff", marginBottom: 28 }}>
              <span style={{ display: "block", overflow: "hidden" }}>
                <motion.span
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.45, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: "block", color: "#fff" }}
                >
                  Pare de fingir
                </motion.span>
              </span>
              <span style={{ display: "block", overflow: "hidden" }}>
                <motion.span
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.55, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: "block", color: "#7c5cfc" }}
                >
                  que vai ser
                </motion.span>
              </span>
              <span style={{ display: "block", overflow: "hidden" }}>
                <motion.span
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.65, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: "block", color: "rgba(255,255,255,0.2)" }}
                >
                  produtivo.
                </motion.span>
              </span>
            </h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.85, duration: 0.5 }}
              style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}
            >
              O BRIO transforma suas tarefas em um jogo. Você ganha{" "}
              <strong style={{ color: "rgba(255,255,255,0.8)", fontWeight: 400 }}>XP</strong>, sobe de nível e desbloqueia conquistas reais — sem enrolação.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3, duration: 0.5 }}
              style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}
            >
              <Link
                to="/login"
                style={{ background: "#6c47ff", color: "#fff", fontSize: 16, fontWeight: 600, padding: "15px 30px", borderRadius: 12, textDecoration: "none" }}
              >
                Quero começar →
              </Link>
              <Link
                to="/login"
                style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, background: "none", textDecoration: "underline", textUnderlineOffset: 3 }}
              >
                Já tenho conta
              </Link>
            </motion.div>

            {/* Trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.15, duration: 0.5 }}
              style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", display: "flex", gap: 20 }}
            >
              {["Grátis", "Sem cartão", "Sem anúncio"].map((t) => (
                <span key={t}>
                  <span style={{ color: "#7c5cfc" }}>✓ </span>
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — Card Stack */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ position: "relative", width: 320 }}>

              {/* XP Card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: "20px 22px",
                }}
              >
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 10, letterSpacing: "0.4px" }}>TAREFA CONCLUÍDA</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(108,71,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#a68dff", flexShrink: 0 }}>✓</span>
                  Revisar relatório Q2
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 6 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "68%" }}
                    transition={{ delay: 3.1, duration: 0.8 }}
                    style={{ background: "#7c5cfc", borderRadius: 4, height: 6 }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
                  <span>+120 XP</span>
                  <span>68% do nível</span>
                </div>
              </motion.div>

              {/* Level badge */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: "16px 20px",
                  marginTop: 12,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: "rgba(108,71,255,0.25)",
                    border: "1px solid rgba(108,71,255,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#a68dff",
                    flexShrink: 0,
                  }}
                >
                  7
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Nível 7 — Executor</p>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Próximo: Estrategista (lv. 8)</span>
                </div>
              </motion.div>

              {/* Achievement card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: "20px 22px",
                  marginTop: 12,
                }}
              >
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 10, letterSpacing: "0.4px" }}>CONQUISTA DESBLOQUEADA</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>🏆 Semana sem procrastinação</div>
              </motion.div>

              {/* Streak pill */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.2, duration: 0.4 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(239,150,39,0.12)",
                  border: "0.5px solid rgba(239,150,39,0.3)",
                  color: "#f5a623",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 14px",
                  borderRadius: 20,
                  marginTop: 12,
                }}
              >
                🔥 7 dias de sequência
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── REST OF PAGE ─── */}

      {/* TICKER */}
      <Marquee />

      {/* ANTES VS DEPOIS */}
      <section className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading font-black text-3xl sm:text-5xl tracking-tight mb-12"
          >
            A diferença é simples.
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden">
            <div className="bg-background p-8">
              <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-5">
                 Antes do BRIO
              </p>
              <ul className="space-y-3">
                {before.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <span className="text-destructive/60 mt-0.5 shrink-0">✕</span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="bg-primary/5 p-8">
              <p className="text-xs font-mono text-primary/60 uppercase tracking-widest mb-5">
                 Com o BRIO
              </p>
              <ul className="space-y-3">
                {after.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 text-sm text-foreground font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 px-5 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-3">
                Como funciona
              </p>
              <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tight leading-tight">
                Funciona igual a um jogo.{" "}
                <span className="text-primary">Porque é um jogo.</span>
              </h2>
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                 A diferença entre jogar e trabalhar é que no jogo você sabe seu progresso a cada segundo. O BRIO traz isso para sua rotina — sem precisar instalar nada.
              </p>
            </motion.div>

            <div className="space-y-0 divide-y divide-border">
              {[
                { n: "1", t: "Crie sua conta", d: "Leva menos de 30 segundos. Nenhum dado seu sai daqui." },
                { n: "2", t: "Adicione o que precisa fazer", d: "Tarefas, prioridades, prazos. Simples assim." },
                { n: "3", t: "Complete e ganhe XP", d: "Cada tarefa concluída dá pontos reais. Use o Pomodoro para ganhar bônus." },
                { n: "4", t: "Veja sua evolução", d: "Nível, conquistas, sequências. Seu progresso fica visível — não invisível." },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="py-5 flex gap-4 group"
                >
                  <span className="text-2xl font-heading font-black text-primary/20 group-hover:text-primary/50 transition-colors w-6 shrink-0">
                    {step.n}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{step.t}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{step.d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-28 px-5 border-t border-border/30">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading font-black text-4xl sm:text-6xl tracking-tight leading-tight">
              Chega de<br />
              <span className="text-primary">amanhã.</span>
            </h2>
            <p className="mt-3 text-muted-foreground text-sm max-w-sm">
              Sua lista de pendências não vai diminuir sozinha. Mas com XP envolvido, pelo menos fica mais divertido limpar.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="shrink-0"
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-base px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-[0_4px_24px_hsl(250_85%_65%/0.3)]"
            >
              Começar agora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/30 py-6 px-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #7c5cfc, #5b3fe8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
              ⚡
            </div>
            <span className="text-xs font-heading font-bold">BRIO</span>
          </div>
          <p className="text-xs text-muted-foreground/30">© 2026</p>
          <Link to="/login" className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors">
            Entrar →
          </Link>
        </div>
      </footer>
    </div>
  );
}
