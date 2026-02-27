"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  FileText,
  Menu,
  X,
  LogOut,
  Settings,
  Boxes,
  ChevronUp,
  DollarSign,
  Target,
  Warehouse,
} from "lucide-react";
import { useAuth } from "@/_lib/auth-context";
import { cn } from "@/_lib/utils";
import { Button } from "@/_components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/_components/ui/avatar";
import { Separator } from "@/_components/ui/separator";
import {
  AnimatePresence,
  motion,
} from "motion/react";

const sidebarSections = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Inventory", href: "/admin/inventory", icon: Package },
      { label: "Finance", href: "/admin/finance", icon: TrendingUp },
      { label: "Reports", href: "/admin/reports", icon: FileText },
    ],
  },
  {
    title: "AI Tools",
    items: [
      { label: "Cost Optimization", href: "/admin/cost-optimization", icon: DollarSign },
      { label: "Scenario Planning", href: "/admin/scenario-planning", icon: Target },
      { label: "Warehouse Optimization", href: "/admin/warehouse-optimization", icon: Warehouse },
    ],
  },
];

const allItems = sidebarSections.flatMap((s) => s.items);

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function BottomSection({
  user,
  router,
  pathname,
  logout,
}: {
  user: any;
  router: any;
  pathname: string;
  logout: () => void;
}) {
  const [showSignOut, setShowSignOut] = useState(false);
  const isSettingsActive = pathname.startsWith("/admin/settings");

  return (
    <div className="mt-auto border-t border-black/5 px-3 py-3 space-y-1">
      <button
        onClick={() => router.push("/admin/settings")}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isSettingsActive
            ? "bg-muted text-foreground font-medium"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <Settings className="h-[18px] w-[18px] shrink-0" />
        <span>Settings</span>
      </button>

      <Separator className="my-2" />

      <button
        onClick={() => setShowSignOut((prev) => !prev)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/60"
      >
        <Avatar className="h-8 w-8">
          {user?.avatar ? (
            <AvatarImage src={user.avatar} alt={user.name} />
          ) : null}
          <AvatarFallback className="bg-muted text-xs text-foreground">
            {user ? getInitials(user.name) : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 text-left">
          <p className="truncate text-sm font-medium text-foreground">
            {user?.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <ChevronUp
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            showSignOut ? "rotate-0" : "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {showSignOut && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span>Sign out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const SidebarContent = () => (
    <>
      {/* Sidebar header */}
      <div className="flex h-14 items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-foreground" />
          <span className="text-lg font-bold uppercase tracking-wide text-foreground">
            MindForge
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 space-y-6 px-3 pt-4">
        {sidebarSections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section: Settings, User */}
      <BottomSection user={user} router={router} pathname={pathname} logout={logout} />
    </>
  );

  return (
    <div
      className="flex h-screen overflow-hidden text-foreground p-3 gap-3"
      style={{
        background: "linear-gradient(135deg, #B8FFD0 0%, #FFF6C9 100%)",
        fontFamily: 'var(--font-inter), sans-serif',
        fontSize: '110%',
      }}
    >
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex w-[260px] shrink-0 flex-col rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm border border-white/50">
        <SidebarContent />
      </aside>

      {/* Sidebar — Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-white shadow-lg transition-transform duration-300 md:hidden m-3 rounded-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm border border-white/50">
        {/* Welcome header */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-base text-foreground">
              Welcome, {user?.name?.split(" ")[0] ?? "User"}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 pt-0 sm:p-6 sm:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
