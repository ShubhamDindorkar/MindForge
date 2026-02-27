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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !email) return;

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    login(email, password, selectedRole);
    router.push(selectedRole === "admin" ? "/admin/dashboard" : "/worker");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="relative z-10 w-full max-w-md space-y-6">
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
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedRole("admin")}
              className="group rounded-lg border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="group rounded-lg border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
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
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setSelectedRole(null);
                    setEmail("");
                    setPassword("");
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
