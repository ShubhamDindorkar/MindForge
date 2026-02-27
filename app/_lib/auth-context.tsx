"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { User } from "./types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: "admin") => void;
  loginWithGoogle: (role: "admin") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY_USER = "stockshiftai_user";
const STORAGE_KEY_ROLE = "stockshiftai_role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Persist user to localStorage whenever it changes
  const persistUser = useCallback((u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
      localStorage.setItem(STORAGE_KEY_ROLE, u.role);
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_ROLE);
    }
  }, []);

  // On mount: restore user from localStorage, then listen to Firebase auth
  useEffect(() => {
    // 1. Try restoring mock user from localStorage
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    }

    // 2. Listen for Firebase auth state (overrides mock user for Google logins)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const storedRole = localStorage.getItem(STORAGE_KEY_ROLE) as "admin" | null;
        const restored: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "User",
          email: firebaseUser.email || "",
          role: storedRole || "admin",
          avatar: firebaseUser.photoURL || undefined,
        };
        setUser(restored);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(restored));
      }
      // Whether Firebase user exists or not, loading is done
      setIsLoading(false);
    });

    // If Firebase never fires (no Google user), resolve loading after a short delay
    const timeout = setTimeout(() => setIsLoading(false), 500);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = useCallback(
    (email: string, _password: string, role: "admin") => {
      const mockUser: User = {
        id: "usr-admin-01",
        name: "Alex Admin",
        email,
        role,
        avatar: undefined,
      };
      persistUser(mockUser);
    },
    [persistUser]
  );

  const loginWithGoogle = useCallback(
    async (role: "admin") => {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const u: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "User",
        email: firebaseUser.email || "",
        role,
        avatar: firebaseUser.photoURL || undefined,
      };
      persistUser(u);
    },
    [persistUser]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    persistUser(null);
  }, [persistUser]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
