import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  // Reset dev DB to satisfy the “test users + solved quizzes + real votes” requirements.
  await prisma.userAchievement.deleteMany();
  await prisma.gameRound.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.quizFact.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.fact.deleteMany();
  await prisma.playerStats.deleteMany();
  await prisma.user.deleteMany();
  await prisma.achievement.deleteMany();

  const ACHIEVEMENTS = [
    {
      key: "play_1",
      title: "Первый шаг",
      description: "Сыграйте минимум 1 раунд.",
      icon: "step",
    },
    {
      key: "correct_1",
      title: "Есть попадание",
      description: "Ответьте правильно хотя бы 1 раз.",
      icon: "check",
    },
    {
      key: "correct_3",
      title: "Три верных",
      description: "Сделайте минимум 3 правильных ответа.",
      icon: "triple",
    },
    {
      key: "correct_10",
      title: "Десять точных",
      description: "Соберите минимум 10 правильных ответов.",
      icon: "ten",
    },
    {
      key: "play_5",
      title: "Разогрев",
      description: "Сыграйте минимум 5 раундов.",
      icon: "warmup",
    },
    {
      key: "play_20",
      title: "Профи режима",
      description: "Сыграйте минимум 20 раундов.",
      icon: "pro",
    },
    {
      key: "streak_3",
      title: "Серия x3",
      description: "3 правильных ответа подряд.",
      icon: "streak3",
    },
    {
      key: "streak_5",
      title: "Серия x5",
      description: "5 правильных ответов подряд.",
      icon: "streak5",
    },
    {
      key: "accuracy_50",
      title: "50% интуиции",
      description: "Точность >= 50% после 10 раундов.",
      icon: "acc50",
    },
    {
      key: "accuracy_80",
      title: "80% хладнокровия",
      description: "Точность >= 80% после 20 раундов.",
      icon: "acc80",
    },
  ];

  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: {},
      create: a,
    });
  }

  const FACTS_BY_GENRE = {
    SCIENCE: [
      {
        text: "В вакууме звук не распространяется.",
        isTrue: true,
        hint: "Нужна среда (воздух/вещество).",
        explanation: "Звук — это волны давления, для них нужен носитель. В вакууме носителя нет, поэтому слышимость невозможна.",
        why: "Отсутствует среда для передачи колебаний.",
        sources: "Учебные материалы по акустике и физике волн.",
      },
      {
        text: "Радиация бывает только лучами света, а не частицами.",
        isTrue: false,
        hint: "Радиация = больше чем «свет».",
        explanation: "Радиация включает разные виды излучений и частиц (например, альфа/бета/гамма). Свет — лишь частный случай электромагнитного излучения.",
        why: "Есть излучения не только электромагнитного типа.",
        sources: "Материалы по основам радиационной физики.",
      },
      {
        text: "Пчёлы способны видеть ультрафиолет.",
        isTrue: true,
        hint: "Для нас это невидимо.",
        explanation: "У ультрафиолетового диапазона есть эффект на восприятие пчёл: они используют его для навигации и распознавания растений.",
        why: "Иная чувствительность фотопигментов.",
        sources: "Научпоп-обзоры о зрении насекомых.",
      },
      {
        text: "Антибиотики лечат вирусы так же эффективно, как бактерии.",
        isTrue: false,
        hint: "К вирусам антибиотики не «прилетают».",
        explanation: "Антибиотики действуют на бактерии, а вирусы размножаются иначе и не имеют тех же мишеней.",
        why: "Другой тип микроорганизмов и механизмов.",
        sources: "Гайды по медицинскому применению антибиотиков.",
      },
      {
        text: "Свет от Солнца до Земли идёт примерно 8 минут.",
        isTrue: true,
        hint: "Время измеряется не в секундах, а в минутах.",
        explanation: "Расстояние до Солнца большое, поэтому даже при скорости света задержка заметна и составляет около 8 минут.",
        why: "Скорость света конечна.",
        sources: "Справочные данные по астрономическим расстояниям и скорости света.",
      },
      {
        text: "Трение всегда увеличивает скорость тела.",
        isTrue: false,
        hint: "Трение чаще мешает движению.",
        explanation: "Трение обычно противодействует движению и превращает часть энергии в тепло, снижая скорость.",
        why: "Сила трения направлена против относительного движения.",
        sources: "Физика: силы трения и законы Ньютона.",
      },
    ],
    HISTORY: [
      {
        text: "Римляне строили акведуки для доставки воды в города.",
        isTrue: true,
        hint: "Водопроводы Древнего Рима.",
        explanation: "Акведуки — инженерные сооружения для подачи воды на большие расстояния, включая городские центры.",
        why: "Благодаря каналам и уклонам вода могла течь самотёком.",
        sources: "Обзоры по истории Римской империи и инженерии.",
      },
      {
        text: "Средневековые европейцы массово считали, что Земля плоская.",
        isTrue: false,
        hint: "Не было единого «все плоско».",
        explanation: "Идея шарообразности Земли обсуждалась давно, а представления о мире были разнообразными по регионам и эпохам.",
        why: "Миф о «плоской Земле» долго переупрощали.",
        sources: "Современные исторические исследования и учебные обзоры.",
      },
      {
        text: "Папирус использовали для письма в Древнем Египте.",
        isTrue: true,
        hint: "Египетские «листы» из растения.",
        explanation: "Папирус делали из растительного сырья, получая материал для свитков и записей.",
        why: "Есть сырьё, есть технология изготовления писчего материала.",
        sources: "Энциклопедические статьи про папирус и письменность.",
      },
      {
        text: "Викинги никогда не выходили за пределы Балтийского моря.",
        isTrue: false,
        hint: "Англия/Исландия не исчезают из карты.",
        explanation: "Викинги совершали дальние походы и торговали в разных регионах, включая северные Атлантические маршруты.",
        why: "Исторические свидетельства говорят о более широком географическом присутствии.",
        sources: "Краткие исторические справки о викингах и навигации.",
      },
      {
        text: "Древние греки изобрели интернет.",
        isTrue: false,
        hint: "Им не хватало электричества и сетей.",
        explanation: "Концепция сети и современный интернет появились намного позже — это технологический процесс XIX-XX веков.",
        why: "Разрыв на тысячи лет в технологиях связи.",
        sources: "Исторические материалы о развитии связи и вычислений.",
      },
      {
        text: "Кругосветное путешествие Магеллана завершили после смерти Магеллана.",
        isTrue: true,
        hint: "Команда довела дело до конца.",
        explanation: "Магеллан погиб в ходе экспедиции, а часть маршрута и завершение путешествия связаны с дальнейшими решениями команды.",
        why: "Экспедиция продолжилась, несмотря на гибель руководителя.",
        sources: "Исторические справки об экспедиции Магеллана и Элкано.",
      },
    ],
    WEIRD: [
      {
        text: "У осьминога три сердца.",
        isTrue: true,
        hint: "Головоногие и «необычная геометрия органов».",
        explanation: "Два сердца гонят кровь через жабры, а третье — по всему телу.",
        why: "Функционально сердца распределены между зонами снабжения.",
        sources: "Научпоп-обзоры по биологии головоногих.",
      },
      {
        text: "Акулы дышат так же, как киты, и жабры у китов тоже есть.",
        isTrue: false,
        hint: "Киты — млекопитающие.",
        explanation: "Киты дышат воздухом легкими, а акулы используют жабры.",
        why: "Разные классы животных и разные дыхательные системы.",
        sources: "Зоологические справки по акулам и китам.",
      },
      {
        text: "Полярное сияние видно только днём, а ночью никогда.",
        isTrue: false,
        hint: "Ночное небо — главный экран.",
        explanation: "Полярные сияния чаще наблюдают ночью, когда темно и свечение заметнее.",
        why: "Контраст с фоном важен для наблюдения.",
        sources: "Материалы по физике магнитосферы и атмосферы.",
      },
      {
        text: "Ленивцы двигаются очень медленно из-за особенностей обмена веществ.",
        isTrue: true,
        hint: "Метаболизм — ключ.",
        explanation: "У ленивцев сниженный уровень активности и медленный обмен, что помогает экономить энергию.",
        why: "Экономия энергии важнее скорости в их среде.",
        sources: "Зоологические обзоры о ленивцах.",
      },
      {
        text: "Тараканы могут жить без головы бесконечно долго.",
        isTrue: false,
        hint: "Не «бессмертны», а «некоторое время».",
        explanation: "Без головы тараканы могут некоторое время жить за счёт резервов, но бесконечно — нет.",
        why: "Система дыхания и выживания всё равно ограничена биологически.",
        sources: "Биологические материалы о выживании насекомых.",
      },
      {
        text: "Кошки мурлыкают не только когда довольны.",
        isTrue: true,
        hint: "Мурчание бывает и в других ситуациях.",
        explanation: "Кошки мурлыкают по разным причинам: от общения и просьб до поведения, связанного со стрессом или комфортом.",
        why: "Это не один-единственный «смысл».",
        sources: "Ветеринарные/научпоп-обзоры о кошачьем поведении.",
      },
    ],
    MIXED: [
      {
        text: "Человек лучше запоминает события, если рассказывает их другим, чем если просто молчит.",
        isTrue: true,
        hint: "Эффект повторения и осмысления.",
        explanation: "Проговаривание помогает структурировать информацию, укрепляет след памяти и может улучшать запоминание.",
        why: "Включаются дополнительные процессы обработки информации.",
        sources: "Психология обучения и эффекты мнемоники.",
      },
      {
        text: "Кровь у всех людей абсолютно синяя, потому что в венах так её видно.",
        isTrue: false,
        hint: "Синие вены — это оптика.",
        explanation: "Кровь человека обычно красная (за счёт гемоглобина), а синеватый оттенок вен связан с восприятием и просвечиванием тканей.",
        why: "Цвет сосудов зависит от окружающих тканей и света.",
        sources: "Биология человека и справочные материалы по гемоглобину.",
      },
      {
        text: "Отпечатки пальцев у людей уникальны (в среднем) и используются как способ идентификации.",
        isTrue: true,
        hint: "Узор формируется во внутриутробном периоде и стабилен.",
        explanation: "Рисунок папиллярных линий действительно индивидуален у большинства людей и может применяться для распознавания.",
        why: "Индивидуальные вариации формируют уникальный паттерн.",
        sources: "Материалы криминалистики и биологии кожи.",
      },
      {
        text: "До появления компьютеров мосты никогда не строили.",
        isTrue: false,
        hint: "Строили без калькуляторов.",
        explanation: "Мосты строились задолго до компьютеров — использовались инженерные расчёты, практика и технологии своего времени.",
        why: "Ум и мастерство существовали раньше.",
        sources: "История инженерии и архитектуры.",
      },
      {
        text: "Понижение влажности воздуха может иногда усиливать ощущение холода зимой.",
        isTrue: true,
        hint: "Тело теряет тепло иначе при разной влажности.",
        explanation: "При сухом воздухе испарение с поверхности тела может усиливаться, что влияет на ощущение температуры.",
        why: "Система терморегуляции реагирует на условия окружающей среды.",
        sources: "Справочные материалы по метеорологии и биофизике.",
      },
      {
        text: "Штрих-коды предназначены только для передачи звука.",
        isTrue: false,
        hint: "Это же про оптическое считывание!",
        explanation: "Штрих-коды кодируют информацию визуально и считываются сканером, а не передают звук напрямую.",
        why: "Основной канал — оптика и кодирование данных.",
        sources: "Справки по штрихкодам и принципам кодирования.",
      },
    ],
  };

  function makeFactCommon(f, genre) {
    return {
      genre,
      text: f.text,
      isTrue: f.isTrue,
      explanation: f.why + "\n\n" + f.explanation,
      sources: f.sources,
      hint1: f.hint,
      hint2: f.hint,
      hint3: f.hint,
      crowdThinksTrue: 50,
    };
  }

  // Create facts + quizzes: 3 quizzes per genre, каждый квиз — ровно 3 вопроса (пул по 6 фактов).
  const ALL_GENRES = ["SCIENCE", "HISTORY", "WEIRD", "MIXED"];
  const allQuizzes = [];

  for (const genre of ALL_GENRES) {
    const pool = FACTS_BY_GENRE[genre] ?? [];
    if (pool.length !== 6) {
      throw new Error(`Need exactly 6 seed facts for ${genre}.`);
    }

    const createdFacts = [];
    for (const f of pool) {
      const fact = await prisma.fact.create({
        data: makeFactCommon(f, genre),
        select: { id: true },
      });
      createdFacts.push(fact.id);
    }

    const quizDefs = [
      { title: `${genre} #1`, idxs: [0, 1, 2] },
      { title: `${genre} #2`, idxs: [2, 3, 4] },
      { title: `${genre} #3`, idxs: [3, 4, 5] },
    ];

    for (const qd of quizDefs) {
      const quiz = await prisma.quiz.create({
        data: {
          genre,
          title: qd.title,
          createdByUserId: null,
        },
        select: { id: true },
      });
      allQuizzes.push(quiz.id);

      await prisma.quizFact.createMany({
        data: qd.idxs.map((factIdx, i) => ({
          quizId: quiz.id,
          factId: createdFacts[factIdx],
          index: i,
        })),
      });
    }
  }

  // Users
  const users = [];
  const TEST_PASSWORD = "password123";
  for (let i = 1; i <= 10; i++) {
    const email = `test${i}@example.com`;
    const name = `Тест Пользователь ${i}`;
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, image: null, stats: { create: {} } },
      select: { id: true },
    });
    users.push(user.id);
  }

  // Fetch quiz facts for simulation
  const quizzesWithFacts = await prisma.quiz.findMany({
    where: { id: { in: allQuizzes } },
    select: {
      id: true,
      genre: true,
      quizFacts: {
        orderBy: { index: "asc" },
        select: {
          index: true,
          factId: true,
          fact: { select: { isTrue: true } },
        },
      },
    },
  });

  // Simulate resolved quizzes: each user completes ~8 out of 12 quizzes
  for (const userId of users) {
    const accuracyTarget = 0.55 + Math.random() * 0.25; // 55..80% correct on average
    const shuffled = shuffle(allQuizzes);
    const chosenQuizIds = shuffled.slice(0, 8);

    for (const quizId of chosenQuizIds) {
      const quiz = quizzesWithFacts.find((q) => q.id === quizId);
      if (!quiz) continue;

      await prisma.gameSession.create({
        data: {
          userId,
          quizId,
          total: quiz.quizFacts.length,
          current: quiz.quizFacts.length,
          hintsUsed: 0,
          finishedAt: new Date(),
          rounds: {
            create: quiz.quizFacts.map((qf) => {
              const correct = Math.random() < accuracyTarget;
              const answer = correct ? qf.fact.isTrue : !qf.fact.isTrue;
              return {
                index: qf.index,
                factId: qf.factId,
                answer,
                isCorrect: answer === qf.fact.isTrue,
                crowdShown: true,
              };
            }),
          },
        },
        select: { id: true },
      });
    }
  }

  for (const userId of users) {
    const rounds = await prisma.gameRound.findMany({
      where: { session: { userId } },
      select: { isCorrect: true, sessionId: true, index: true },
      orderBy: [{ sessionId: "asc" }, { index: "asc" }],
    });

    // Calculate win streak (max consecutive correct) within the ordered rounds we pulled.
    let current = 0;
    let max = 0;
    let totalRounds = 0;
    let correctAnswers = 0;

    for (const r of rounds) {
      totalRounds += 1;
      if (r.isCorrect) {
        correctAnswers += 1;
        current += 1;
        max = Math.max(max, current);
      } else {
        current = 0;
      }
    }

    const accuracy = totalRounds ? (correctAnswers / totalRounds) * 100 : 0;

    await prisma.playerStats.upsert({
      where: { userId },
      update: {
        accuracy,
        winStreak: max,
        totalRounds,
        correctAnswers,
      },
      create: {
        userId,
        accuracy,
        winStreak: max,
        totalRounds,
        correctAnswers,
      },
    });

    const totalKeyMap = {
      play_1: totalRounds >= 1,
      correct_1: correctAnswers >= 1,
      correct_3: correctAnswers >= 3,
      correct_10: correctAnswers >= 10,
      play_5: totalRounds >= 5,
      play_20: totalRounds >= 20,
      streak_3: max >= 3,
      streak_5: max >= 5,
      accuracy_50: totalRounds >= 10 && accuracy >= 50,
      accuracy_80: totalRounds >= 20 && accuracy >= 80,
    };

    const achievementRows = await prisma.achievement.findMany({
      select: { id: true, key: true },
    });

    for (const a of achievementRows) {
      if (totalKeyMap[a.key]) {
        await prisma.userAchievement.upsert({
          where: { userId_achievementId: { userId, achievementId: a.id } },
          update: {},
          create: { userId, achievementId: a.id },
        });
      }
    }
  }

  console.log(`Seed complete. Quizzes: ${allQuizzes.length}, Users: ${users.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

