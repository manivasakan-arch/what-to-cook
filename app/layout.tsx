import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Agentation } from "agentation";
import { StoreProvider } from "@/components/StoreProvider";

export const metadata: Metadata = {
  title: "What to Cook?",
  description: "Random South Indian Tamil meal picker with a protein goal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900">
        <StoreProvider>
          <header className="border-b bg-white">
            <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3 text-sm font-medium">
              <Link href="/" className="text-lg font-bold text-orange-600">What to Cook?</Link>
              <Link href="/library" className="hover:text-orange-600">Library</Link>
              <Link href="/settings" className="hover:text-orange-600">Settings</Link>
            </nav>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
          <Agentation />
        </StoreProvider>
      </body>
    </html>
  );
}
