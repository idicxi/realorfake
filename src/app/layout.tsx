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
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
