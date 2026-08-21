import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const subjectId = searchParams.get("subjectId");
  const dateStr = searchParams.get("date");

  if (!subjectId || !dateStr) {
    return Response.json({ error: "Missing subjectId or date" }, { status: 400 });
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  const localDate = new Date(y, m - 1, d);
  const dayOfWeek = localDate.getDay();

  const schedules = await prisma.schedule.findMany({
    where: { subjectId, isActive: true, dayOfWeek }
  });

  const overrides = await prisma.scheduleOverride.findMany({
    where: { 
      subjectId, 
      date: new Date(dateStr) 
    }
  });

  const slots: { id: string; label: string; time: string; weight?: number }[] = [];
  schedules.forEach(s => slots.push({ id: s.id, label: `Regular: ${s.startTime} - ${s.endTime}`, time: s.startTime }));
  overrides.forEach(o => slots.push({ id: o.id, label: `Extra: ${o.originalTime} - ${o.newTime}`, time: o.originalTime || "", weight: o.weight }));

  slots.sort((a, b) => a.time.localeCompare(b.time));

  return Response.json({ slots });
}
