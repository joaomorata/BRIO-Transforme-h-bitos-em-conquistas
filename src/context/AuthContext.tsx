import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarColor: string;
  role: "user" | "admin";
  createdAt: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Omit<UserProfile, "id" | "role" | "createdAt">>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPw: string, newPw: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function profileFromAuthUser(authUser: User): UserProfile {
  const metadata = authUser.user_metadata ?? {};

  return {
    id: authUser.id,
    name: metadata.name || metadata.full_name || authUser.email?.split("@")[0] || "Estudante",
    email: authUser.email || "",
    bio: metadata.bio || "Comece sua jornada de produtividade.",
    avatarColor: metadata.avatarColor || "#7c3aed",
    role: metadata.role === "admin" ? "admin" : "user",
    createdAt: authUser.created_at,
  };
}

function translateAuthError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (text.includes("user already registered")) return "Já existe uma conta com este e-mail.";
  if (text.includes("email rate limit exceeded")) return "O limite de envio de e-mails foi atingido. Tente novamente mais tarde.";
  if (text.includes("email not confirmed")) return "Seu e-mail ainda não foi confirmado. Confirme o e-mail antes de entrar.";
  if (text.includes("password should be at least")) return "A senha deve ter pelo menos 8 caracteres.";
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback((authUser: User | null) => {
    setUser(authUser ? profileFromAuthUser(authUser) : null);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        syncUser(data.session?.user ?? null);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) syncUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [syncUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) return { success: false, error: translateAuthError(error.message) };
    syncUser(data.user);
    return { success: true };
  }, [syncUser]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          full_name: name.trim(),
          bio: "Comece sua jornada de produtividade.",
          avatarColor: "#7c3aed",
          role: "user",
        },
      },
    });

    if (error) return { success: false, error: translateAuthError(error.message) };

    if (!data.user) {
      return { success: false, error: "Não foi possível criar a conta." };
    }

    // Quando a confirmação de e-mail está desligada, o Supabase normalmente
    // devolve a sessão junto com o signUp. Se a sessão não vier, tentamos
    // entrar imediatamente com as mesmas credenciais. Isso também deixa o
    // fluxo compatível com configurações do projeto que retornem o usuário
    // antes da sessão.
    if (data.session) {
      syncUser(data.user);
      return { success: true };
    }

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (!loginError && loginData.user) {
      syncUser(loginData.user);
      return { success: true };
    }

    if (loginError?.message.toLowerCase().includes("email not confirmed")) {
      return {
        success: false,
        error: "A conta foi criada, mas o Supabase ainda está exigindo confirmação de e-mail. Desative 'Confirm email' no provedor Email e salve a configuração.",
      };
    }

    return {
      success: false,
      error: loginError ? translateAuthError(loginError.message) : "A conta foi criada, mas não foi possível iniciar a sessão.",
    };
  }, [syncUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (
    data: Partial<Omit<UserProfile, "id" | "role" | "createdAt">>,
  ) => {
    if (!user) return { success: false, error: "Não autenticado." };

    const metadata: Record<string, string> = {};
    if (data.name !== undefined) metadata.name = data.name;
    if (data.bio !== undefined) metadata.bio = data.bio;
    if (data.avatarColor !== undefined) metadata.avatarColor = data.avatarColor;

    const { data: result, error } = await supabase.auth.updateUser({
      email: data.email && data.email !== user.email ? data.email : undefined,
      data: metadata,
    });

    if (error) return { success: false, error: translateAuthError(error.message) };
    syncUser(result.user);
    return { success: true };
  }, [user, syncUser]);

  const changePassword = useCallback(async (currentPw: string, newPw: string) => {
    if (!user) return { success: false, error: "Não autenticado." };

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPw,
    });

    if (loginError) return { success: false, error: "Senha atual incorreta." };

    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) return { success: false, error: translateAuthError(error.message) };

    return { success: true };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
