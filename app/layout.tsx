import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/_lib/auth-context";
import { InventoryProvider } from "@/_lib/inventory-context";
import { LenisProvider } from "./components/LenisProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "StockShiftAI - Inventory Management",
  description: "Streamline your inventory. Master your finances.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <LenisProvider>
          <AuthProvider>
            <InventoryProvider>{children}</InventoryProvider>
          </AuthProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
