import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

async function main() {
  console.log("🌱 Seeding database...");

  // Create super admin
  const adminPassword = await bcrypt.hash("admin123!", 12);
  const superAdmin = await prisma.staffAccount.upsert({
    where: { email: "admin@novaenglish.uz" },
    update: {},
    create: {
      email: "admin@novaenglish.uz",
      password: adminPassword,
      name: "Super Admin",
      role: "SUPER_ADMIN",
    },
  });

  // Finance admin
  await prisma.staffAccount.upsert({
    where: { email: "finance@novaenglish.uz" },
    update: {},
    create: {
      email: "finance@novaenglish.uz",
      password: await bcrypt.hash("finance123!", 12),
      name: "Finance Manager",
      role: "FINANCE_ADMIN",
    },
  });

  // Support teacher
  await prisma.staffAccount.upsert({
    where: { email: "teacher@novaenglish.uz" },
    update: {},
    create: {
      email: "teacher@novaenglish.uz",
      password: await bcrypt.hash("teacher123!", 12),
      name: "Support Teacher",
      role: "TEACHER",
    },
  });

  // Sample lessons
  const lessons = [
    { title: "Introduction to English Alphabet", youtubeId: "dQw4w9WgXcQ", level: "A1", order: 1, category: "vocabulary", description: "Learn the English alphabet and basic pronunciation." },
    { title: "Basic Greetings & Introductions", youtubeId: "dQw4w9WgXcQ", level: "A1", order: 2, category: "speaking", description: "How to greet people and introduce yourself in English." },
    { title: "Numbers 1-100", youtubeId: "dQw4w9WgXcQ", level: "A1", order: 3, category: "vocabulary", description: "Learn to count from 1 to 100 in English." },
    { title: "Present Simple Tense", youtubeId: "dQw4w9WgXcQ", level: "A2", order: 1, category: "grammar", description: "Understanding and using the present simple tense." },
    { title: "Daily Routines Vocabulary", youtubeId: "dQw4w9WgXcQ", level: "A2", order: 2, category: "vocabulary", description: "Words and phrases for describing your daily routine." },
    { title: "IELTS Reading Strategies", youtubeId: "dQw4w9WgXcQ", level: "B1", order: 1, category: "reading", description: "Key strategies for IELTS Reading section success." },
    { title: "Academic Writing Task 1", youtubeId: "dQw4w9WgXcQ", level: "B2", order: 1, category: "writing", description: "How to describe graphs and charts for IELTS Writing Task 1." },
  ];

  for (const lesson of lessons) {
    await prisma.lesson.upsert({
      where: { id: (await prisma.lesson.findFirst({ where: { title: lesson.title } }))?.id ?? 0 },
      update: {},
      create: { ...lesson, isPublished: true },
    });
  }

  // Sample vocabulary test
  const vocabTest = await prisma.test.upsert({
    where: { id: (await prisma.test.findFirst({ where: { title: "A1 Vocabulary Quiz" } }))?.id ?? 0 },
    update: {},
    create: {
      title: "A1 Vocabulary Quiz",
      type: "VOCABULARY",
      level: "A1",
      isPublished: true,
      coinReward: 10,
      timeLimit: 300,
      description: "Test your basic English vocabulary knowledge",
    },
  });

  // Sample questions
  const questions = [
    { text: "What is the correct spelling?", type: "MULTIPLE_CHOICE" as const, options: [{ id: "a", text: "Aple" }, { id: "b", text: "Apple" }, { id: "c", text: "Appel" }], correctAnswer: "b", order: 1 },
    { text: "\"Hello\" means...", type: "MULTIPLE_CHOICE" as const, options: [{ id: "a", text: "Salom" }, { id: "b", text: "Xayr" }, { id: "c", text: "Rahmat" }], correctAnswer: "a", order: 2 },
    { text: "How many letters are in the English alphabet?", type: "MULTIPLE_CHOICE" as const, options: [{ id: "a", text: "24" }, { id: "b", text: "25" }, { id: "c", text: "26" }], correctAnswer: "c", order: 3 },
  ];

  for (const q of questions) {
    const existing = await prisma.question.findFirst({ where: { testId: vocabTest.id, order: q.order } });
    if (!existing) {
      await prisma.question.create({ data: { ...q, testId: vocabTest.id } });
    }
  }

  // Sample speaking test
  await prisma.test.upsert({
    where: { id: (await prisma.test.findFirst({ where: { title: "General Speaking Practice" } }))?.id ?? 0 },
    update: {},
    create: {
      title: "General Speaking Practice",
      type: "SPEAKING",
      level: "A2",
      isPublished: true,
      coinReward: 0,
      description: "Describe your daily routine in English. Record a 1-2 minute audio response.",
    },
  });

  // Sample library resources
  const resources = [
    { title: "Cambridge IELTS 18", type: "LINK", url: "https://example.com", level: "B2", tags: ["IELTS", "practice"], description: "Official Cambridge IELTS practice tests" },
    { title: "English Grammar in Use", type: "LINK", url: "https://example.com", level: "B1", tags: ["grammar", "reference"], description: "Raymond Murphy's essential grammar reference" },
    { title: "IELTS Vocabulary List", type: "PDF", url: "https://example.com/vocab.pdf", level: "B2", tags: ["vocabulary", "IELTS"], description: "Essential vocabulary for IELTS exam" },
  ];

  for (const r of resources) {
    await prisma.libraryResource.upsert({
      where: { id: (await prisma.libraryResource.findFirst({ where: { title: r.title } }))?.id ?? 0 },
      update: {},
      create: { ...r, isPublished: true },
    });
  }

  // Sample dictionary words
  const words = [
    { word: "Serendipity", translation: "Tasodifiy baxtli kashfiyot", pronunciation: "/ˌserənˈdɪpɪti/", definition: "The occurrence of happy events by chance", exampleSentence: "Finding that bookstore was pure serendipity.", level: "C1" },
    { word: "Eloquent", translation: "Notiqlik qobiliyatiga ega", pronunciation: "/ˈeləkwənt/", definition: "Fluent and persuasive in speaking", exampleSentence: "She gave an eloquent speech.", level: "B2" },
    { word: "Ambitious", translation: "Ambitsiyali, maqsadli", pronunciation: "/æmˈbɪʃəs/", definition: "Having a strong desire for success", exampleSentence: "He is an ambitious young entrepreneur.", level: "B1" },
  ];

  for (const w of words) {
    const existing = await prisma.dictionaryWord.findFirst({ where: { word: w.word } });
    if (!existing) await prisma.dictionaryWord.create({ data: w });
  }

  console.log("✅ Seed completed!");
  console.log("👤 Admin accounts:");
  console.log("   admin@novaenglish.uz / admin123!");
  console.log("   finance@novaenglish.uz / finance123!");
  console.log("   teacher@novaenglish.uz / teacher123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
