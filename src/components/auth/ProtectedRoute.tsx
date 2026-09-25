import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
<<<<<<< HEAD
  const { user, roleResolved } = useAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!roleResolved) return null;
=======
  const { user } = useAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
>>>>>>> 3239e0440856565940536f3ef89c6a821d8a4437
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
