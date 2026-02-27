"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/_lib/auth-context";
import { Button } from "@/_components/ui/button";
import { Avatar, AvatarFallback } from "@/_components/ui/avatar";
import { Home, ScanLine, Clock, Boxes, LogOut } from "lucide-react";

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
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">MindForge</span>
        </div>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{user.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
