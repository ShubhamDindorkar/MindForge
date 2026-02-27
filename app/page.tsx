"use client";

import Link from "next/link";
import {
  Package,
  ScanLine,
  BarChart3,
  FileText,
  ArrowRight,
  ChevronRight,
  Boxes,
} from "lucide-react";
import { Button } from "@/_components/ui/button";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo,
  NavbarButton,
} from "@/_components/navbar";
import { useState } from "react";

const features = [
  {
    icon: Package,
    title: "Inventory Tracking",
    description:
      "Real-time stock levels across all warehouses. Know exactly what you have and where it is.",
  },
  {
    icon: ScanLine,
    title: "QR Code Scanning",
    description:
      "Workers scan items instantly with their phones. Stock in, stock out, zero friction.",
  },
  {
    icon: BarChart3,
    title: "Financial Insights",
    description:
      "Cost tracking, profit & loss, and forecasting built right into your inventory flow.",
  },
  {
    icon: FileText,
    title: "Smart Reports",
    description:
      "Valuation, movement, and financial reports generated with a single click.",
  },
];

const steps = [
  {
    number: "01",
    title: "Scan",
    description: "Workers scan QR codes on inventory items using the mobile app.",
  },
  {
    number: "02",
    title: "Track",
    description: "Every movement is logged. Stock levels update automatically.",
  },
  {
    number: "03",
    title: "Analyze",
    description: "Admins see dashboards, financials, and forecasts in real time.",
  },
];

const navItems = [
  { name: "Product", link: "#features" },
  { name: "How it works", link: "#how-it-works" },
  { name: "For teams", link: "#features" },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <NavbarButton variant="secondary" href="/login">
              Log in
            </NavbarButton>
            <NavbarButton variant="primary" href="/login">
              Get started
            </NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            />
          </MobileNavHeader>
          <MobileNavMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setMobileOpen(false)}
                className="relative text-neutral-600"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => setMobileOpen(false)}
                variant="primary"
                className="w-full"
                href="/login"
              >
                Log in
              </NavbarButton>
              <NavbarButton
                onClick={() => setMobileOpen(false)}
                variant="primary"
                className="w-full"
                href="/login"
              >
                Get started
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden -mt-16">
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-6 text-5xl font-medium tracking-tight sm:text-6xl lg:text-7xl text-foreground">
            Streamline Your Inventory.<br />
            Master Your Finances.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            The all-in-one platform that connects warehouse operations to financial
            planning. Track stock, scan QR codes, and see your bottom line - all
            in one place.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="text-base">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-base">
                Learn More <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-medium sm:text-4xl">
              Everything you need to run your warehouse
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              From the loading dock to the boardroom. One platform, total visibility.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-lg border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <div className="mb-4 inline-flex rounded-lg bg-muted p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-normal">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y bg-card/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-medium sm:text-4xl">
              How it works
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Three simple steps from scan to insight.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-px w-full bg-gradient-to-r from-border to-transparent sm:block" />
                )}
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-medium text-foreground">
                  {step.number}
                </div>
                <h3 className="mb-2 text-xl font-normal">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-medium sm:text-4xl">
            Ready to take control?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join MindForge and transform how you manage inventory and finances.
          </p>
          <Link href="/login">
            <Button size="lg" className="text-base">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            <span className="font-normal">MindForge</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MindForge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
