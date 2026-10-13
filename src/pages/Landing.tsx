import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, Zap, Trophy, Flame, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const ticker = [
  "Ganhe XP",
  "Suba de nível",
  "Foque com Pomodoro",
  "Complete tarefas",
  "Desbloqueie conquistas",
  "Acompanhe seu progresso",
  "Seja mais produtivo",
  "Ganhe XP",
  "Suba de nível",
  "Foque com Pomodoro",
  "Complete tarefas",
  "Desbloqueie conquistas",
  "Acompanhe seu progresso",
  "Seja mais produtivo",
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

function Logomark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-lg bg-primary flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <Zap className="text-primary-foreground" style={{ width: size * 0.5, height: size * 0.5 }} fill="currentColor" />
    </div>
  );
}

export default function Landing() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ─── ANIMATED HERO ─── */}
      <section className="relative overflow-hidden flex flex-col bg-background min-h-screen">
        {/* Grid background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(hsl(250 85% 65% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(250 85% 65% / 0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1.2 }}
          className="absolute pointer-events-none"
          style={{
            width: 500,
            height: 300,
            background: "radial-gradient(ellipse, hsl(250 85% 65% / 0.22) 0%, transparent 70%)",
            top: -60,
            left: -80,
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
              className="absolute inset-0 flex items-center justify-center bg-background"
              style={{ zIndex: 99 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="flex items-center gap-3"
              >
                <Logomark size={44} />
                <span className="text-foreground font-heading" style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px" }}>
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
          className="flex items-center justify-between px-9 py-[18px] border-b border-foreground/[0.07] relative"
          style={{ zIndex: 2 }}
        >
          <div className="flex items-center gap-2.5 text-foreground font-heading" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px" }}>
            <Logomark size={32} />
            BRIO
          </div>
          <div className="flex gap-2 items-center">
            <Link
              to="/login"
              className="text-foreground/55 hover:text-foreground/80 transition-colors no-underline"
              style={{ fontSize: 13, padding: "7px 14px", borderRadius: 8 }}
            >
              Entrar
            </Link>
            <Link
              to="/login"
              className="bg-primary hover:bg-primary/90 text-primary-foreground no-underline transition-colors"
              style={{ fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 9 }}
            >
              Criar conta
            </Link>
          </div>
        </motion.nav>

        {/* HERO CONTENT */}
        <div
          className="relative flex-1 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 lg:gap-12 mx-auto w-full"
          style={{ zIndex: 2, maxWidth: 1200, padding: "40px clamp(20px, 6vw, 56px)" }}
        >
          {/* Left */}
          <div className="flex-1 w-full" style={{ maxWidth: 580 }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.3, duration: 0.5 }}
              className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/35 text-primary uppercase mb-7"
              style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.8px", padding: "6px 14px", borderRadius: 20 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Plataforma de produtividade
            </motion.div>

            {/* Headline */}
            <h1 className="font-heading" style={{ fontSize: "clamp(2.75rem, 8vw, 4.75rem)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: 28 }}>
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.45, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="block text-foreground"
                >
                  Pare de fingir
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.55, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="block text-primary"
                >
                  que vai ser
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.65, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="block text-foreground/20"
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
              className="text-foreground/50"
              style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}
            >
              O BRIO transforma suas tarefas em um jogo. Você ganha{" "}
              <strong className="text-foreground/80" style={{ fontWeight: 400 }}>XP</strong>, sobe de nível e desbloqueia conquistas reais — sem enrolação.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3, duration: 0.5 }}
              className="flex items-center gap-5 mb-8"
            >
              <Link
                to="/login"
                className="bg-primary hover:bg-primary/90 text-primary-foreground no-underline transition-colors"
                style={{ fontSize: 16, fontWeight: 600, padding: "15px 30px", borderRadius: 12 }}
              >
                Quero começar →
              </Link>
              <Link
                to="/login"
                className="text-foreground/55 hover:text-foreground/75 transition-colors"
                style={{ fontSize: 16, textDecoration: "underline", textUnderlineOffset: 3 }}
              >
                Já tenho conta
              </Link>
            </motion.div>

            {/* Trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.15, duration: 0.5 }}
              className="text-foreground/25 flex gap-5"
              style={{ fontSize: 14 }}
            >
              {["Grátis", "Sem cartão", "Sem anúncio"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — Card Stack */}
          <div className="w-full lg:shrink-0" style={{ maxWidth: 320 }}>
            <div className="relative w-full">

              {/* XP Card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-foreground/[0.04] border border-foreground/10 rounded-2xl"
                style={{ padding: "20px 22px" }}
              >
                <div className="text-foreground/35" style={{ fontSize: 12, marginBottom: 10, letterSpacing: "0.4px" }}>TAREFA CONCLUÍDA</div>
                <div className="text-foreground flex items-center gap-2.5" style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>
                  <span className="w-[22px] h-[22px] rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  </span>
                  Revisar relatório Q2
                </div>
                <div className="bg-foreground/[0.08] rounded h-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "68%" }}
                    transition={{ delay: 3.1, duration: 0.8 }}
                    className="bg-primary rounded h-1.5"
                  />
                </div>
                <div className="flex justify-between text-foreground/30 mt-2" style={{ fontSize: 13 }}>
                  <span>+120 XP</span>
                  <span>68% do nível</span>
                </div>
              </motion.div>

              {/* Level badge */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3.5 bg-foreground/[0.04] border border-foreground/10 rounded-2xl mt-3"
                style={{ padding: "16px 20px" }}
              >
                <div
                  className="rounded-xl bg-primary/25 border border-primary/40 flex items-center justify-center text-primary font-heading shrink-0"
                  style={{ width: 46, height: 46, fontSize: 20, fontWeight: 900 }}
                >
                  7
                </div>
                <div>
                  <p className="text-foreground" style={{ fontSize: 15, fontWeight: 600 }}>Nível 7 — Executor</p>
                  <span className="text-foreground/35" style={{ fontSize: 13 }}>Próximo: Estrategista (lv. 8)</span>
                </div>
              </motion.div>

              {/* Achievement card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-foreground/[0.04] border border-foreground/10 rounded-2xl mt-3"
                style={{ padding: "20px 22px" }}
              >
                <div className="text-foreground/35" style={{ fontSize: 12, marginBottom: 10, letterSpacing: "0.4px" }}>CONQUISTA DESBLOQUEADA</div>
                <div className="text-foreground flex items-center gap-2" style={{ fontSize: 16, fontWeight: 600 }}>
                  <Trophy className="w-4 h-4 text-[hsl(45_90%_60%)]" />
                  Semana sem procrastinação
                </div>
              </motion.div>

              {/* Streak pill */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.2, duration: 0.4 }}
                className="inline-flex items-center gap-1.5 bg-[hsl(45_90%_60%/0.12)] border border-[hsl(45_90%_60%/0.3)] text-[hsl(45_90%_60%)] mt-3"
                style={{ fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 20 }}
              >
                <Flame className="w-3.5 h-3.5" />
                7 dias de sequência
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
          <div className="flex items-center gap-2">
            <Logomark size={24} />
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
