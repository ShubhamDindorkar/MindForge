"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ScanLine, Boxes, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/_lib/auth-context";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/_components/ui/card";
import { cn } from "@/_lib/utils";
import Link from "next/link";

type Role = "admin" | "worker" | null;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !email) return;

    setIsLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 800));
    login(email, password, selectedRole);
    router.push(selectedRole === "admin" ? "/admin/dashboard" : "/worker");
  };

  const handleGoogleSignIn = async () => {
    if (!selectedRole) return;
    setIsGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle(selectedRole);
      router.push(selectedRole === "admin" ? "/admin/dashboard" : "/worker");
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
      {/* Top spotlight gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0">
        <div className="h-52 w-full rounded-b-[999px] bg-gradient-to-b from-[#B8FFD0] to-[#FFF6C9] blur-2xl opacity-100" />
      </div>
      {/* Bottom spotlight gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="h-52 w-full rounded-t-[999px] bg-gradient-to-t from-[#B8FFD0] to-[#FFF6C9] blur-2xl opacity-100" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-4 sm:space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Boxes className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-medium">MindForge</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            {selectedRole
              ? `Sign in as ${selectedRole}`
              : "Select your role to continue"}
          </p>
        </div>

        {!selectedRole ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => setSelectedRole("admin")}
              className="group rounded-lg border bg-card p-4 sm:p-6 text-left transition-all hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="mb-4 inline-flex rounded-lg bg-muted p-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 font-normal">Admin</h3>
              <p className="text-xs text-muted-foreground">
                Manage inventory, analytics & finances
              </p>
            </button>
            <button
              onClick={() => setSelectedRole("worker")}
              className="group rounded-lg border bg-card p-4 sm:p-6 text-left transition-all hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="mb-4 inline-flex rounded-lg bg-muted p-3">
                <ScanLine className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 font-normal">Worker</h3>
              <p className="text-xs text-muted-foreground">
                Scan items & update stock levels
              </p>
            </button>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {selectedRole === "admin" ? (
                  <Shield className="h-5 w-5 text-primary" />
                ) : (
                  <ScanLine className="h-5 w-5 text-primary" />
                )}
                {selectedRole === "admin" ? "Admin" : "Worker"} Login
              </CardTitle>
              <CardDescription>
                Enter your credentials to access the{" "}
                {selectedRole === "admin" ? "dashboard" : "mobile app"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon className="mr-2 h-4 w-4" />
                  )}
                  {isGoogleLoading ? "Signing in..." : "Continue with Google"}
                </Button>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setSelectedRole(null);
                    setEmail("");
                    setPassword("");
                    setError(null);
                  }}
                >
                  Choose a different role
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
