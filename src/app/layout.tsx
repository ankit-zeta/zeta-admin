import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminConvexClientProvider } from "@/lib/convex";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZetaGrow — Admin Control Panel",
  description: "Administrative control system for managing programs, work marketplace, affiliates, finance, and system configuration.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-bgWarm text-textMain antialiased`}>
        <AdminConvexClientProvider>
          {children}
        </AdminConvexClientProvider>
      </body>
    </html>
  );
}
