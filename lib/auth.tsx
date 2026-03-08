// ============================================================
// auth.ts — React auth context for KiwiPenNotes
// Provides: useAuth() hook with user, profile, loading state
// ============================================================

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import {
  getSupabase,
  getProfile,
  upsertProfile,
  type UserProfile,
  type SubscriptionTier,
} from "./supabase";

// ---- Context types ----

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  tier: SubscriptionTier;
  isPro: boolean;
  isPlus: boolean;
  isPaid: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ---- Provider ----

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Send welcome email (fire-and-forget, only on first login)
  const sendWelcomeEmail = useCallback(async () => {
    try {
      const { data: { session: s } } = await getSupabase().auth.getSession();
      if (!s?.access_token) return;
      await fetch("/api/welcome-email", {
        method: "POST",
        headers: { Authorization: `Bearer ${s.access_token}` },
      });
    } catch {
      // Silent fail — welcome email is non-critical
    }
  }, []);

  // Load profile for user (email passed explicitly to avoid stale closure)
  const loadProfile = useCallback(async (userId: string, email?: string) => {
    const p = await getProfile(userId);
    if (!p) {
      // First login — create profile & send welcome email
      await upsertProfile(userId, {
        email: email || user?.email || "",
        subscription_tier: "free",
        subscription_status: "none",
        stt_hours_used: 0,
      });
      const created = await getProfile(userId);
      setProfile(created);
      sendWelcomeEmail();
    } else {
      setProfile(p);
    }
  }, [user?.email, sendWelcomeEmail]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  // Listen to auth state
  useEffect(() => {
    // Get initial session
    getSupabase().auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id, s.user.email || "").finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Subscribe to changes
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id, s.user.email || "");
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ---- Auth methods ----

  const signUp = async (
    email: string,
    password: string
  ): Promise<string | null> => {
    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return error?.message ?? null;
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<string | null> => {
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    return error?.message ?? null;
  };

  const signInWithGoogle = async () => {
    await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await getSupabase().auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string): Promise<string | null> => {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return error?.message ?? null;
  };

  const tier: SubscriptionTier =
    profile?.subscription_status === "active"
      ? profile.subscription_tier
      : "free";

  const isActive = profile?.subscription_status === "active";
  const isProUser = tier === "pro" && isActive;
  const isPlusUser = tier === "plus" && isActive;
  const isPaidUser = (tier === "plus" || tier === "pro") && isActive;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        refreshProfile,
        tier,
        isPro: isProUser,
        isPlus: isPlusUser,
        isPaid: isPaidUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---- Hook ----

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
