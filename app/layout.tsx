import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Agentation } from "agentation";
import { StoreProvider } from "@/components/StoreProvider";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

export const metadata: Metadata = {
  title: "What to Cook?",
  description: "Random South Indian Tamil meal picker with a protein goal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body className="min-h-screen">
        <StoreProvider>
          <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-cream/85 backdrop-blur">
            <nav className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
              <Link href="/" className="font-display text-xl font-semibold text-terracotta">
                What to Cook?
              </Link>
              <div className="ml-auto flex items-center gap-5 text-sm font-medium text-stone-600">
                <Link href="/" className="hover:text-terracotta">Home</Link>
                <Link href="/library" className="hover:text-terracotta">Library</Link>
                <Link href="/settings" className="hover:text-terracotta">Settings</Link>
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
          <Agentation />
        </StoreProvider>
      </body>
    </html>
  );
}
