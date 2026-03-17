import { ButtonLink } from "@/components/ui/Button";

export default function NewQuizPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-14">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
        <h1 className="text-3xl font-black tracking-tight">Создать новый квиз</h1>
        <p className="mt-3 text-white/70">
          В этой версии я сделал полный игровой цикл с базой/аккаунтами. Конструктор квизов можно
          добавить следующим шагом (формы + модерация + импорт источников).
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/game" size="lg">
            Перейти в игру
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" size="lg">
            На главную
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

