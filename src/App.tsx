import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute, { AdminRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import Pomodoro from "@/pages/Pomodoro";
import Achievements from "@/pages/Achievements";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import Admin from "@/pages/Admin";
import Estudar from "@/pages/Estudar";
import Ranking from "@/pages/Ranking";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

function RootRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter basename={base}>
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/pomodoro" element={<Pomodoro />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/edit" element={<EditProfile />} />
                  <Route path="/estudar" element={<Estudar />} />
                  <Route path="/ranking" element={<Ranking />} />
                </Route>

                <Route element={<AdminRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/admin" element={<Admin />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
