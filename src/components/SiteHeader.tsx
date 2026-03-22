"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { useGameSession } from "@/context/GameSessionContext";

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
      prefetch={false}
      className="pointer-events-auto rounded-full px-4 py-2 text-sm text-white/75 hover:bg-white/5 hover:text-white"
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const { data } = useSession();
  const user = data?.user;
  const pathname = usePathname();
  const router = useRouter();
  const gameSession = useGameSession();

  async function handleProfileNav(e: React.MouseEvent<HTMLAnchorElement>) {
    const sid = gameSession?.activeSessionId;
    if (pathname !== "/game" || !sid) return;
    e.preventDefault();
    try {
      await fetch("/api/game/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId: sid }),
      });
    } catch {
      /* всё равно уходим в профиль */
    } finally {
      gameSession?.setActiveSessionId(null);
      router.push("/profile");
    }
  }

  return (
    <header className="sticky top-0 z-[60] border-b border-white/10 bg-[#0b0614]/85 backdrop-blur-xl pointer-events-auto shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link href="/" prefetch={false} className="group pointer-events-auto flex shrink-0 items-center gap-2">
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

          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-none">
            <NavLink href="/">Главная</NavLink>
            <NavLink href="/game">Игра</NavLink>
            <Link
              href="/profile"
              prefetch={false}
              onClick={handleProfileNav}
              className="pointer-events-auto rounded-full px-4 py-2 text-sm text-white/75 hover:bg-white/5 hover:text-white"
            >
              Профиль
            </Link>
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
            <Link
              href="/profile"
              prefetch={false}
              onClick={handleProfileNav}
              className="rounded-full p-1 hover:bg-white/5"
            >
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

