import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { bulkAttendanceSchema } from "@/lib/validations/subject";
import { notifyUserModification } from "@/lib/attendance-notifier";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = bulkAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { date, records: recs } = parsed.data;
    const results = [];

    for (const rec of recs) {
      const subject = await prisma.subject.findFirst({
        where: { id: rec.subjectId, userId: user.id },
      });
      if (!subject) continue;

      const record = await prisma.attendanceRecord.upsert({
        where: {
          subjectId_userId_date_scheduleId: {
            subjectId: rec.subjectId,
            userId: user.id,
            date: new Date(date),
            scheduleId: rec.scheduleId || "",
          },
        },
        create: {
          subjectId: rec.subjectId,
          userId: user.id,
          scheduleId: rec.scheduleId || null,
          date: new Date(date),
          status: rec.status,
          source: "bulk",
        },
        update: {
          status: rec.status,
          editedAt: new Date(),
        },
      });
      results.push(record);
    }

    // Recalc stats for all affected subjects
    const subjectIds = [...new Set(recs.map((r) => r.subjectId))];
    for (const sid of subjectIds) {
      const allRecords = await prisma.attendanceRecord.findMany({ where: { subjectId: sid } });
      const countable = allRecords.filter((r) => !["holiday", "cancelled"].includes(r.status));
      const present = countable.filter((r) => r.status === "present" || r.status === "late").length;
      const pct = countable.length === 0 ? 0 : Math.round((present / countable.length) * 10000) / 100;
      await prisma.subject.update({
        where: { id: sid },
        data: {
          totalClassesHeld: countable.length,
          totalPresent: countable.filter((r) => r.status === "present").length,
          totalAbsent: countable.filter((r) => r.status === "absent").length,
          totalLate: countable.filter((r) => r.status === "late").length,
          totalExcused: countable.filter((r) => r.status === "excused").length,
          currentPercentage: pct,
        },
      });
    }

    notifyUserModification(user.id, "Bulk Attendance Saved", `Successfully recorded ${results.length} attendance updates across ${subjectIds.length} subjects.`).catch(console.error);
    return Response.json({ records: results, count: results.length }, { status: 201 });
  } catch (error) {
    console.error("Bulk attendance error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
