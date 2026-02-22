import type { Metadata } from "next";
import "./globals.css";
import { CountdownBanner } from "@/components/layout/CountdownBanner";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "CBO Prep",
  description: "Canadian Biology Olympiad preparation app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <CountdownBanner />
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
