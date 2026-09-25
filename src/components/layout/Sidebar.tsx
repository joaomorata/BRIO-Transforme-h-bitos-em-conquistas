import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListTodo, Trophy, Timer, User, Menu, X, Zap, LogOut, Shield, BookOpen, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/tasks", icon: ListTodo, label: "Tarefas" },
  { path: "/pomodoro", icon: Timer, label: "Foco" },
  { path: "/estudar", icon: BookOpen, label: "Estudar" },
  { path: "/achievements", icon: Trophy, label: "Conquistas" },
  { path: "/ranking", icon: Crown, label: "Ranking" },
  { path: "/profile", icon: User, label: "Perfil" },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileToggle: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen, onMobileToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = (user?.name || "U").slice(0, 2).toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col h-full items-center py-4">
      <div className="mb-6 flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-1 shadow-[0_0_20px_hsl(250_85%_65%/0.4)]">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">BRIO</span>
      </div>

      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onMobileToggle(false)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl w-full transition-all duration-200",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}

        {user?.role === "admin" && (
          <Link
            to="/admin"
            onClick={() => onMobileToggle(false)}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl w-full transition-all duration-200",
              location.pathname === "/admin"
                ? "bg-primary/20 text-primary"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">Admin</span>
          </Link>
        )}
      </nav>

      <div className="flex flex-col items-center gap-2 w-full px-2 mt-2">
        <Link
          to="/profile"
          onClick={() => onMobileToggle(false)}
          title={user?.name}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: user?.avatarColor || "#7c3aed" }}
        >
          {initials}
        </Link>
        <button
          onClick={handleLogout}
          title="Sair"
          className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl w-full text-gray-500 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[10px] font-medium leading-none">Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-16 bg-gray-900 flex-shrink-0 flex-col h-screen sticky top-0 border-r border-gray-800">
        {sidebarContent}
      </aside>

      <button
        onClick={() => onMobileToggle(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-gray-900 border border-gray-700"
      >
        {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => onMobileToggle(false)}
            />
            <motion.aside
              initial={{ x: -80 }}
              animate={{ x: 0 }}
              exit={{ x: -80 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-40 w-16 bg-gray-900 flex flex-col border-r border-gray-800"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
