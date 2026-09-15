import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-8xl font-heading font-black text-primary">404</p>
        <h1 className="text-2xl font-heading font-bold text-foreground mt-4">Página não encontrada</h1>
        <p className="text-muted-foreground mt-2">A página que você está procurando não existe.</p>
        <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Home className="w-4 h-4" />
          Voltar ao início
        </Link>
      </motion.div>
    </div>
  );
}
