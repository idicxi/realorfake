"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();

  const [name, setName] = useState("");
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

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = (await res.json().catch(() => null)) as
      | { ok: true; userId: string }
      | { ok: false; error: string }
      | null;

    if (!res.ok || !data || ("ok" in data && data.ok === false)) {
      setLoading(false);
      setError((data && "error" in data ? data.error : null) ?? "Не удалось зарегистрироваться.");
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (!signInRes || signInRes.error) {
      router.push("/login");
      return;
    }
    router.push("/profile");
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-9 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
        <h1 className="text-3xl font-black tracking-tight">Регистрация</h1>
        <p className="mt-2 text-sm text-white/65">
          Создайте аккаунт, чтобы сохранять статистику, серию и достижения.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <div className="text-xs font-semibold text-white/70">Имя</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Арина"
              className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-violet-400/60"
              required
              minLength={2}
              maxLength={40}
            />
          </label>

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
              placeholder="минимум 6 символов"
              className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-violet-400/60"
              required
              minLength={6}
              maxLength={100}
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <Button className="w-full" size="lg" disabled={loading}>
            {loading ? "Создаём..." : "Зарегистрироваться"}
          </Button>
        </form>
      </div>
    </main>
  );
}

