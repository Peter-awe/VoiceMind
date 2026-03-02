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
  refreshProfile: () => Promise<void>;
  tier: SubscriptionTier;
  isPro: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ---- Provider ----

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile for user
  const loadProfile = useCallback(async (userId: string) => {
    const p = await getProfile(userId);
    if (!p) {
      // First login — create profile
      await upsertProfile(userId, {
        email: user?.email || "",
        subscription_tier: "free",
        subscription_status: "none",
        stt_hours_used: 0,
      });
      const created = await getProfile(userId);
      setProfile(created);
    } else {
      setProfile(p);
    }
  }, [user?.email]);

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
        loadProfile(s.user.id).finally(() => setLoading(false));
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
        loadProfile(s.user.id);
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
        emailRedirectTo: `${window.location.origin}/record`,
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
        redirectTo: `${window.location.origin}/record`,
      },
    });
  };

  const signOut = async () => {
    await getSupabase().auth.signOut();
    setProfile(null);
  };

  const tier: SubscriptionTier =
    profile?.subscription_status === "active"
      ? profile.subscription_tier
      : "free";

  const isProUser =
    tier === "pro" && profile?.subscription_status === "active";

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
        refreshProfile,
        tier,
        isPro: isProUser,
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
