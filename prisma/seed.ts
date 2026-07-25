import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@attendease.app" },
    update: {},
    create: {
      email: "demo@attendease.app",
      name: "Demo Student",
      passwordHash,
      timezone: "Asia/Kolkata",
      emailVerified: new Date(),
    },
  });

  // Create notification settings
  await prisma.notificationSetting.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  // Create semester
  const semester = await prisma.semester.create({
    data: {
      userId: user.id,
      name: "Semester 5 — Fall 2026",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-11-30"),
      isCurrent: true,
    },
  });

  // Create subjects
  const subjects = [
    { name: "Data Structures", code: "CS301", instructorName: "Prof. Sharma", colorHex: "#6366F1", minAttendancePct: 75 },
    { name: "DBMS", code: "CS302", instructorName: "Prof. Verma", colorHex: "#EC4899", minAttendancePct: 75 },
    { name: "Operating Systems", code: "CS303", instructorName: "Prof. Kumar", colorHex: "#F59E0B", minAttendancePct: 75 },
    { name: "Computer Networks", code: "CS304", instructorName: "Prof. Singh", colorHex: "#22C55E", minAttendancePct: 75 },
    { name: "Software Engineering", code: "CS305", instructorName: "Prof. Gupta", colorHex: "#06B6D4", minAttendancePct: 75 },
  ];

  const createdSubjects = [];
  for (const sub of subjects) {
    const s = await prisma.subject.create({
      data: { ...sub, userId: user.id, semesterId: semester.id },
    });
    createdSubjects.push(s);
  }

  // Create schedules
  const scheduleData = [
    { subjectIdx: 0, dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "301" },
    { subjectIdx: 0, dayOfWeek: 3, startTime: "09:00", endTime: "10:00", room: "301" },
    { subjectIdx: 0, dayOfWeek: 5, startTime: "09:00", endTime: "10:00", room: "301" },
    { subjectIdx: 1, dayOfWeek: 1, startTime: "11:00", endTime: "12:00", room: "205" },
    { subjectIdx: 1, dayOfWeek: 4, startTime: "11:00", endTime: "12:00", room: "205" },
    { subjectIdx: 2, dayOfWeek: 2, startTime: "14:00", endTime: "15:00", room: "Lab 3" },
    { subjectIdx: 2, dayOfWeek: 4, startTime: "14:00", endTime: "15:00", room: "Lab 3" },
    { subjectIdx: 3, dayOfWeek: 2, startTime: "09:00", endTime: "10:00", room: "102" },
    { subjectIdx: 3, dayOfWeek: 5, startTime: "11:00", endTime: "12:00", room: "102" },
    { subjectIdx: 4, dayOfWeek: 3, startTime: "14:00", endTime: "15:00", room: "401" },
    { subjectIdx: 4, dayOfWeek: 5, startTime: "14:00", endTime: "15:00", room: "401" },
  ];

  for (const sched of scheduleData) {
    await prisma.schedule.create({
      data: {
        subjectId: createdSubjects[sched.subjectIdx].id,
        userId: user.id,
        dayOfWeek: sched.dayOfWeek,
        startTime: sched.startTime,
        endTime: sched.endTime,
        room: sched.room,
      },
    });
  }

  // Create attendance records for the past 30 days
  const statuses = ["present", "present", "present", "present", "absent", "late", "present"];
  const today = new Date();

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dow = date.getDay();

    for (const sched of scheduleData) {
      if (sched.dayOfWeek !== dow) continue;
      const subject = createdSubjects[sched.subjectIdx];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await prisma.attendanceRecord.create({
        data: {
          subjectId: subject.id,
          userId: user.id,
          date: new Date(date.toISOString().slice(0, 10)),
          status,
          source: "manual",
        },
      });
    }
  }

  // Recalculate stats for all subjects
  for (const subject of createdSubjects) {
    const records = await prisma.attendanceRecord.findMany({
      where: { subjectId: subject.id },
    });
    const countable = records.filter((r) => !["holiday", "cancelled"].includes(r.status));
    const present = countable.filter((r) => r.status === "present").length;
    const absent = countable.filter((r) => r.status === "absent").length;
    const late = countable.filter((r) => r.status === "late").length;
    const excused = countable.filter((r) => r.status === "excused").length;
    const effective = present + late;
    const pct = countable.length === 0 ? 0 : Math.round((effective / countable.length) * 10000) / 100;

    // Calculate streak
    const sorted = countable.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let streak = 0;
    for (const rec of sorted) {
      if (rec.status === "present" || rec.status === "late") streak++;
      else break;
    }

    await prisma.subject.update({
      where: { id: subject.id },
      data: {
        totalClassesHeld: countable.length,
        totalPresent: present,
        totalAbsent: absent,
        totalLate: late,
        totalExcused: excused,
        currentPercentage: pct,
        streakCount: streak,
        longestStreak: streak,
      },
    });
  }

  console.log("Seed complete!");
  console.log("Login: demo@attendease.app / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
