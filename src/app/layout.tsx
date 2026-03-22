import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";

import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/SiteHeader";
import { authOptions } from "@/server/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RealOrFake — Правда или вымысел",
  description: "Игра: угадай, правда это или вымысел.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#07040d] text-white`}
      >
        <Providers session={session}>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            {/* Footer stays at the bottom on short pages */}
            <footer className="mt-auto border-t border-white/10 bg-[#0b0614]/70">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/15 shadow-[0_0_0_1px_rgba(124,58,237,0.35)_inset]">
                    <span className="text-sm font-black tracking-tight text-violet-200">
                      ROF
                    </span>
                  </div>
                  <div className="text-sm text-white/70">Факт или Фейк? — игра для любознательных</div>
                </div>
                <div className="text-sm text-white/60">© 2026 Факт или Фейк? — игра для любознательных</div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
