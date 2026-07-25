import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const url = new URL(req.url);
  const subjectId = url.searchParams.get("subjectId");

  const records = await prisma.attendanceRecord.findMany({
    where: {
      userId: user.id,
      ...(subjectId ? { subjectId } : {}),
    },
    include: { subject: { select: { name: true, code: true } } },
    orderBy: [{ date: "asc" }, { markedAt: "asc" }],
  });

  const header = "Date,Subject,Code,Status,Notes,Marked At\n";
  const rows = records
    .map((r) => {
      const date = new Date(r.date).toISOString().slice(0, 10);
      const markedAt = new Date(r.markedAt).toISOString();
      return `${date},"${r.subject.name}","${r.subject.code || ""}",${r.status},"${r.notes || ""}",${markedAt}`;
    })
    .join("\n");

  return new Response(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="attendease-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
