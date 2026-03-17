"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";

import { Button, ButtonLink } from "@/components/ui/Button";

function Avatar({ name, image }: { name: string; image?: string | null }) {
  const initial = (name?.trim()?.[0] ?? "U").toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-9 w-9 overflow-hidden rounded-full bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset]">
        {image ? (
          <Image src={image} alt={name} fill className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm font-semibold text-white/90">
            {initial}
          </div>
        )}
      </div>
      <div className="hidden sm:block">
        <div className="text-sm font-semibold text-white">{name}</div>
        <div className="text-xs text-white/60">Профиль</div>
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm text-white/75 hover:text-white hover:bg-white/5"
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const { data } = useSession();
  const user = data?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0614]/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="group flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/15 shadow-[0_0_0_1px_rgba(124,58,237,0.35)_inset]">
              <span className="text-sm font-black tracking-tight text-violet-200">ROF</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-white">RealOrFake</div>
              <div className="text-[11px] text-white/55 group-hover:text-white/70">
                правда или вымысел
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/">Главная</NavLink>
            <NavLink href="/game">Игра</NavLink>
            <NavLink href="/profile">Профиль</NavLink>
          </nav>
        </div>

        {!user ? (
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="secondary" size="sm">
              Войти
            </ButtonLink>
            <ButtonLink href="/register" variant="primary" size="sm">
              Регистрация
            </ButtonLink>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/profile" className="rounded-full p-1 hover:bg-white/5">
              <Avatar name={user.name ?? "Пользователь"} image={user.image} />
            </Link>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
              Выйти
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

