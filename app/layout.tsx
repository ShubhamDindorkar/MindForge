import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/_lib/auth-context";
import { InventoryProvider } from "@/_lib/inventory-context";

export const metadata: Metadata = {
  title: "MindForge - Inventory Management",
  description: "Streamline your inventory. Master your finances.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          <InventoryProvider>{children}</InventoryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
