"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/profile");
  }, [router, status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (!res || res.error) {
      setError("Неверный email или пароль.");
      return;
    }
    router.push("/profile");
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-9 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
        <h1 className="text-3xl font-black tracking-tight">Войти</h1>
        <p className="mt-2 text-sm text-white/65">
          Войдите, чтобы сохранять статистику и достижения.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <div className="text-xs font-semibold text-white/70">Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-violet-400/60"
              required
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-white/70">Пароль</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-violet-400/60"
              required
              minLength={6}
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <Button className="w-full" size="lg" disabled={loading}>
            {loading ? "Входим..." : "Войти"}
          </Button>
        </form>
      </div>
    </main>
  );
}

