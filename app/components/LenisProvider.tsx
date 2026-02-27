"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

const LenisContext = createContext<Lenis | null>(null);

type LenisProviderProps = {
  children: React.ReactNode;
  options?: ConstructorParameters<typeof Lenis>[0];
};

export function LenisProvider({ children, options = {} }: LenisProviderProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();

  /* Skip root-level Lenis on /admin routes — admin layout uses its own
     Lenis instance scoped to the nested scroll container. */
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) {
      setLenis(null);
      return;
    }
    const lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      autoRaf: true,
      anchors: true,
      ...options,
    });
    setLenis(lenisInstance);
    return () => lenisInstance.destroy();
  }, [isAdmin]);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}

export function useLenis() {
  return useContext(LenisContext);
}
