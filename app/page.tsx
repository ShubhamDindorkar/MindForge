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
import { useState, useEffect, useRef } from "react";
import SplashCursor from "./components/SplashCursor";

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
    title: "Capture",
    description: "Record inventory movements and updates directly in the system.",
  },
  {
    number: "02",
    title: "Sync",
    description: "Stock levels and costs stay in sync across all warehouses.",
  },
  {
    number: "03",
    title: "Analyze",
    description: "See real-time dashboards, financials, and forecasts in one place.",
  },
];

const navItems = [
  { name: "Product", link: "#features" },
  { name: "How it works", link: "#how-it-works" },
  { name: "For teams", link: "#features" },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const viewHeight = window.innerHeight;
      if (rect.top > viewHeight) {
        setScrollProgress(0);
        return;
      }
      const scrolledInto = viewHeight - rect.top;
      const progress = Math.min(1, Math.max(0, scrolledInto / sectionHeight));
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const stepCount = 3;
  const stepIndex = Math.min(
    stepCount - 1,
    Math.floor(scrollProgress * stepCount)
  );

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
        <SplashCursor />
        {/* Top spotlight gradient */}
        <div className="pointer-events-none absolute inset-x-0 top-0">
          <div className="h-52 w-full rounded-b-[999px] bg-gradient-to-b from-[#B8FFD0] to-[#FFF6C9] blur-2xl opacity-100 spotlight-animate" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h1 className="mb-4 text-3xl font-medium tracking-tight sm:mb-6 sm:text-5xl lg:text-7xl text-foreground">
            Streamline Your Inventory.<br />
            Master Your Finances.
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:mb-10 sm:text-lg">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <section id="how-it-works" ref={sectionRef} className="border-y bg-card/50" style={{ minHeight: "300vh" }}>
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-4 text-center">
          <h2 className="mb-2 text-3xl font-medium sm:text-4xl">
            How it works
          </h2>
          <p className="text-muted-foreground">
            Three simple steps from scan to insight.
          </p>
        </div>
        <div className="sticky top-0 flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 md:flex-row md:gap-12 md:px-8 lg:px-12">
          {/* Left: gradient card with stacked scroll-cards.svg */}
          <div className="flex w-full flex-shrink-0 justify-center md:w-[45%] lg:w-[42%]">
            <div
              className="relative aspect-[4/5] w-full max-w-md rounded-3xl shadow-xl md:aspect-square"
              style={{
                background: "linear-gradient(180deg, #B8FFD0 0%, #FFF6C9 45%, #E8EEFF 100%)",
              }}
            >
              {[0, 1, 2].map((layer) => (
                <div
                  key={layer}
                  className="absolute inset-0 flex items-center justify-center p-6 transition-all duration-500 ease-out md:p-10"
                  style={{
                    transform: `translateY(${layer * 28}px)`,
                    zIndex: 2 - layer,
                    opacity: layer <= stepIndex ? 1 : 0,
                    filter: layer > 0 ? "drop-shadow(0 4px 12px rgba(0,0,0,0.06))" : "drop-shadow(0 8px 24px rgba(0,0,0,0.08))",
                  }}
                >
                  <img
                    src="/svgs/scroll-cards.svg"
                    alt=""
                    className="h-auto w-full max-w-[280px] object-contain opacity-95 md:max-w-[320px]"
                    width={320}
                    height={155}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right: text fades and changes per step */}
          <div className="relative flex w-full flex-col justify-center md:w-[50%] md:max-w-xl">
            <div className="relative min-h-[200px] w-full md:min-h-[240px]">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className="absolute inset-0 flex flex-col justify-center px-4 text-center md:px-0 md:text-left"
                  style={{
                    opacity: index === stepIndex ? 1 : 0,
                    pointerEvents: index === stepIndex ? "auto" : "none",
                    transition: "opacity 0.5s ease-out",
                  }}
                >
                  <h3 className="mb-3 text-2xl font-medium text-foreground md:text-3xl">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground md:text-lg">
                    {step.description}
                  </p>
                  <div className="mt-6 flex gap-2 justify-center md:justify-start">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={`h-2 rounded-full transition-all ${
                          i === stepIndex ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-medium sm:text-4xl">
            Ready to take control?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join StockShiftAI and transform how you manage inventory and finances.
          </p>
          <Link href="/login">
            <Button size="lg" className="text-base">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="relative border-t py-12 overflow-hidden">
        {/* Bottom spotlight gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="h-52 w-full rounded-t-[999px] bg-gradient-to-t from-[#B8FFD0] to-[#FFF6C9] blur-2xl opacity-100 spotlight-animate" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            <span className="font-normal">StockShiftAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} StockShiftAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
