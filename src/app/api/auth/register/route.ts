import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/server/db";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(40),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Некорректные данные." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { ok: false, error: "Пользователь с таким email уже существует." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
      stats: { create: {} },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}

