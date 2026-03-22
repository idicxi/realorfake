import { ButtonLink } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-14">
      <section className="glass-card relative overflow-hidden p-10 md:p-12">
        <div className="pointer-events-none absolute -top-24 right-[-100px] h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-[-120px] h-96 w-96 rounded-full bg-fuchsia-500/25 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/75 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
            RealOrFake
            <span className="text-violet-300/80">•</span>
            интуиция · факты · риск
          </div>

          <h1 className="mt-6 text-balance bg-gradient-to-br from-white via-violet-100 to-violet-300/90 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
            Правда или вымысел
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-white/65">
            Квиз из <span className="font-semibold text-violet-200">пяти вопросов</span>: факт звучит как
            выдумка — угадайте правду. Подсказки, голос толпы и разоблачение с источниками.
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
            text: "Откройте до 3 подсказок, чтобы повысить шансы.",
          },
          {
            n: "03",
            title: "Голос толпы",
            text: "После ответа видно: «75% игроков считают это правдой». Соглашайтесь или идите против толпы.",
          },
          {
            n: "04",
            title: "Разоблачение",
            text: "После ответа — «Почему это правда/ложь?»: научные источники и исторические ссылки.",
          },
        ].map((s) => (
          <div
            key={s.n}
            className="glass-card group p-7 transition hover:border-violet-400/25 hover:shadow-[0_0_40px_rgba(124,58,237,0.12)]"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-violet-300/90">
                Шаг {s.n}
              </div>
              <div className="h-2 w-2 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 opacity-80 shadow-[0_0_12px_rgba(167,139,250,0.8)]" />
            </div>
            <div className="mt-4 text-xl font-bold text-white">{s.title}</div>
            <p className="mt-3 text-sm leading-6 text-white/65">{s.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
