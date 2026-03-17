import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.achievement.upsert({
    where: { key: "first_win" },
    update: {},
    create: {
      key: "first_win",
      title: "Первая победа",
      description: "Ответьте правильно хотя бы один раз.",
      icon: "spark",
    },
  });

  await prisma.achievement.upsert({
    where: { key: "streak_5" },
    update: {},
    create: {
      key: "streak_5",
      title: "Серия x5",
      description: "Соберите серию из 5 правильных ответов подряд.",
      icon: "flame",
    },
  });

  await prisma.achievement.upsert({
    where: { key: "truth_seeker" },
    update: {},
    create: {
      key: "truth_seeker",
      title: "Искатель правды",
      description: "Сыграйте 10 раундов.",
      icon: "target",
    },
  });

  const facts = [
    {
      genre: "SCIENCE",
      text: "У осьминога три сердца.",
      isTrue: true,
      explanation:
        "Два сердца качают кровь через жабры, третье — по всему телу. Когда осьминог плывёт, «системное» сердце может замедляться.",
      sources:
        "Smithsonian Ocean; Encyclopaedia Britannica (Octopus: circulatory system).",
      funnyComment: "Если бы у него было четыре — это уже был бы бухгалтер.",
      hint1: "Речь про головоногих моллюсков.",
      hint2: "У них «не совсем обычная» кровь.",
      hint3: "Одно сердце связано с жабрами.",
      crowdThinksTrue: 78,
    },
    {
      genre: "HISTORY",
      text: "В Древнем Риме существовали «автоматы» по продаже воды за монеты.",
      isTrue: true,
      explanation:
        "Инженер Герон Александрийский описал устройство, где монета открывает клапан и выпускает порцию воды (например, в храмах).",
      sources:
        "Heron of Alexandria, Pneumatica; Cambridge History of Science summaries.",
      funnyComment: "Первый paywall в истории — и тоже за воду.",
      hint1: "Имя из античности часто всплывает в механике.",
      hint2: "Это описано как храмовое устройство.",
      hint3: "Принцип — монета как груз/рычаг для клапана.",
      crowdThinksTrue: 64,
    },
    {
      genre: "WEIRD",
      text: "Человек может выжить, если выпьет литр чистого ослиного пота за раз.",
      isTrue: false,
      explanation:
        "Это вымысел: у ослов практически нет «пота для сбора», а пить неизвестные биожидкости опасно из‑за бактерий и токсинов. Сам факт звучит как интернет-байка.",
      sources: "CDC guidance on zoonotic infections; veterinary physiology references.",
      funnyComment: "Интернет снова предлагает сомнительные челленджи.",
      hint1: "Подумайте, как вообще устроено потоотделение у животных.",
      hint2: "Риски тут не про «вкус».",
      hint3: "Звучит как специально выдуманный факт для кликов.",
      crowdThinksTrue: 22,
    },
    {
      genre: "SCIENCE",
      text: "Банан радиоактивен.",
      isTrue: true,
      explanation:
        "В бананах есть калий, включая изотоп K‑40, который слабо радиоактивен. Доза микроскопическая и безопасная.",
      sources: "US NRC / IAEA explanations of K-40; common physics references.",
      funnyComment: "Банановый эквивалент дозы — звучит страшнее, чем есть.",
      hint1: "Калий — ключевое слово.",
      hint2: "Речь про один из изотопов.",
      hint3: "Это настолько слабо, что используется как мем-метрика.",
      crowdThinksTrue: 71,
    },
  ];

  await prisma.fact.deleteMany();
  for (const f of facts) {
    await prisma.fact.create({
      data: f,
    });
  }
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

