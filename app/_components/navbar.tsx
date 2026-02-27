"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/_lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 80) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      className={cn(
        "fixed inset-x-0 top-4 z-40 flex justify-center px-4",
        className
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible }
            )
          : child
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(14px)" : "blur(0px)",
        boxShadow: visible
          ? "0 18px 45px rgba(15, 23, 42, 0.16)"
          : "0 8px 20px rgba(15, 23, 42, 0.08)",
        y: visible ? 4 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 35,
      }}
      className={cn(
        "relative flex w-full max-w-6xl items-center justify-between rounded-full border border-border bg-white/70 px-4 py-2 shadow-sm backdrop-blur-md",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "hidden flex-1 items-center justify-center gap-1 text-sm font-normal text-muted-foreground lg:flex",
        className
      )}
    >
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative rounded-full px-3 py-1.5"
          key={item.link}
          href={item.link}
        >
          {hovered === idx && (
            <motion.div
              layoutId="nav-hover"
              className="absolute inset-0 rounded-full bg-muted"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{item.name}</span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 18px 45px rgba(15, 23, 42, 0.16)"
          : "0 8px 20px rgba(15, 23, 42, 0.08)",
        y: visible ? 4 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 35,
      }}
      className={cn(
        "flex w-full max-w-6xl items-center justify-between rounded-full border border-border bg-white/80 px-4 py-2 shadow-sm backdrop-blur-md lg:hidden",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn(
            "absolute inset-x-0 top-14 z-50 flex w-full flex-col gap-2 rounded-2xl border border-border bg-white px-4 py-4 shadow-lg",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm"
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      {isOpen ? (
        <IconX className="h-4 w-4" />
      ) : (
        <IconMenu2 className="h-4 w-4" />
      )}
    </button>
  );
};

export const NavbarLogo = () => {
  return (
    <a
      href="/"
      className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-normal text-foreground"
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs">
        MF
      </span>
      <span className="font-medium tracking-tight">MindForge</span>
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
} & (React.ComponentPropsWithoutRef<"a"> &
  React.ComponentPropsWithoutRef<"button">)) => {
  const baseStyles =
    "px-4 py-2 rounded-full text-sm font-medium relative cursor-pointer transition duration-150 inline-flex items-center justify-center";

  const variantStyles: Record<string, string> = {
    primary:
      "bg-foreground text-primary-foreground shadow-[0_10px_40px_rgba(15,23,42,0.25)] hover:-translate-y-0.5",
    secondary:
      "bg-white/80 text-foreground border border-border hover:bg-white",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};

