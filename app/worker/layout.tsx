"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/_lib/auth-context";
import { Avatar, AvatarFallback } from "@/_components/ui/avatar";
import { Home, ScanLine, Clock, Boxes, LogOut } from "lucide-react";
import { cn } from "@/_lib/utils";

const navItems = [
  { href: "/worker", label: "Home", icon: Home },
  { href: "/worker/scan", label: "Scan", icon: ScanLine },
  { href: "/worker/history", label: "History", icon: Clock },
] as const;

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "worker") {
      router.replace("/login");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "worker") return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex min-h-screen items-center justify-center p-3"
      style={{
        background: "linear-gradient(135deg, #B8FFD0 0%, #FFF6C9 100%)",
      }}
    >
      <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-md flex-col rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm border border-white/50">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between rounded-t-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-foreground" />
            <span className="text-sm font-bold uppercase tracking-wide">MindForge</span>
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{user.name}</span>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20">{children}</main>

        {/* Bottom navigation */}
        <nav className="absolute bottom-0 left-0 right-0 z-40 rounded-b-2xl border-t border-black/5 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center justify-around py-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/worker"
                  ? pathname === "/worker"
                  : pathname.startsWith(href);

              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors",
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
