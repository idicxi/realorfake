import { ButtonLink } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-14">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
        <div className="pointer-events-none absolute -top-24 right-[-140px] h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-[-140px] h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs text-white/70 shadow-[0_0_0_1px_rgba(255,255,255,0.10)_inset]">
            RealOrFake
            <span className="text-white/40">•</span>
            игра на интуиции, фактах и риске
          </div>

          <h1 className="mt-6 text-balance text-4xl font-black tracking-tight sm:text-5xl">
            Правда или вымысел
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-white/70">
            Вам дают факт, который звучит как выдумка. Выбирайте: правда или ложь. Открывайте
            подсказки, смотрите «голос толпы» и читайте разоблачение со ссылками.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/game" size="lg" className="sm:w-auto w-full">
              Начать игру
            </ButtonLink>
            <ButtonLink href="/quiz/new" variant="secondary" size="lg" className="sm:w-auto w-full">
              Создать новый квиз
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {[
          {
            n: "01",
            title: "Невероятный факт",
            text: "Вы получаете научный или исторический факт, который звучит как вымысел. Нужно выбрать: правда или ложь?",
          },
          {
            n: "02",
            title: "Система улик",
            text: "Откройте до 3 подсказок, чтобы повысить шансы. Каждая улика уменьшает максимальную награду — риск ищите!",
          },
          {
            n: "03",
            title: "Голос толпы",
            text: "После ответа видно: «75% игроков считают это правдой». Соглашайтесь или идите против толпы.",
          },
          {
            n: "04",
            title: "Разоблачение",
            text: "После ответа — «Почему это правда/ложь?»: научные источники, исторические ссылки и смешные комментарии.",
          },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-violet-200/90">Шаг {s.n}</div>
              <div className="h-2 w-2 rounded-full bg-violet-400/60" />
            </div>
            <div className="mt-4 text-xl font-bold">{s.title}</div>
            <p className="mt-3 text-sm leading-6 text-white/70">{s.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
