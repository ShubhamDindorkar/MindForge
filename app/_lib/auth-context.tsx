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
  login: (email: string, password: string, role: "admin" | "worker") => void;
  loginWithGoogle: (role: "admin" | "worker") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Restore user from Firebase session (default role if not in state)
        const storedRole = localStorage.getItem("mindforge_role") as "admin" | "worker" | null;
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "User",
          email: firebaseUser.email || "",
          role: storedRole || "worker",
          avatar: firebaseUser.photoURL || undefined,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(
    (email: string, _password: string, role: "admin" | "worker") => {
      const mockUser: User = {
        id: role === "admin" ? "usr-admin-01" : "usr-worker-01",
        name: role === "admin" ? "Alex Admin" : "Jordan Worker",
        email,
        role,
        avatar: undefined,
      };
      localStorage.setItem("mindforge_role", role);
      setUser(mockUser);
    },
    []
  );

  const loginWithGoogle = useCallback(
    async (role: "admin" | "worker") => {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      localStorage.setItem("mindforge_role", role);
      setUser({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "User",
        email: firebaseUser.email || "",
        role,
        avatar: firebaseUser.photoURL || undefined,
      });
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    localStorage.removeItem("mindforge_role");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, loginWithGoogle, logout }}
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
