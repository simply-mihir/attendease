"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle2, XCircle, Timer } from "lucide-react";
import clsx from "clsx";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_DOT: Record<string, string> = {
  present: "bg-success", absent: "bg-danger", late: "bg-warning",
  excused: "bg-primary", cancelled: "bg-surface-3", holiday: "bg-surface-3",
};

export default function CalendarPage() {
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/schedules").then((d) => setSchedules(d.schedules)).catch(console.error);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const from = new Date(year, month, 1).toISOString().slice(0, 10);
    const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    apiFetch(`/attendance?from=${from}&to=${to}`).then((d) => setRecords(d.records)).catch(console.error);
  }, [currentDate]);

  function navigate(dir: number) {
    const d = new Date(currentDate);
    if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  }

  // Get week dates
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Get month dates
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const monthStartDay = monthStart.getDay();
  const monthDays: (Date | null)[] = [];
  for (let i = 0; i < monthStartDay; i++) monthDays.push(null);
  for (let d = 1; d <= monthEnd.getDate(); d++) {
    monthDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d));
  }

  const recordMap = new Map<string, any[]>();
  records.forEach((r) => {
    const date = new Date(r.date).toISOString().slice(0, 10);
    if (!recordMap.has(date)) recordMap.set(date, []);
    recordMap.get(date)!.push(r);
  });

  function getClassesForDay(dayOfWeek: number) {
    return schedules.filter((s) => s.dayOfWeek === dayOfWeek);
  }

  const isToday = (d: Date) => d.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex gap-2">
          <button onClick={() => setView("week")}
            className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium transition",
              view === "week" ? "bg-primary text-white" : "bg-surface-2 text-text-secondary hover:bg-surface-3"
            )}>Week</button>
          <button onClick={() => setView("month")}
            className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium transition",
              view === "month" ? "bg-primary text-white" : "bg-surface-2 text-text-secondary hover:bg-surface-3"
            )}>Month</button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-surface rounded-xl border border-border p-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-2 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
        <span className="font-semibold">
          {view === "week"
            ? `${weekDates[0].toLocaleDateString("en-IN", { month: "short", day: "numeric" })} — ${weekDates[6].toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
            : currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
          }
        </span>
        <button onClick={() => navigate(1)} className="p-2 hover:bg-surface-2 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {view === "week" ? (
        /* Week View */
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dayClasses = getClassesForDay(date.getDay());
            const dateStr = date.toISOString().slice(0, 10);
            const dayRecords = recordMap.get(dateStr) || [];
            return (
              <div key={i} className={clsx("bg-surface rounded-xl border p-3 min-h-[180px]",
                isToday(date) ? "border-primary" : "border-border"
              )}>
                <div className="text-center mb-2">
                  <p className="text-xs text-text-muted">{DAYS[date.getDay()]}</p>
                  <p className={clsx("text-lg font-bold", isToday(date) ? "text-primary" : "")}>{date.getDate()}</p>
                </div>
                <div className="space-y-1.5">
                  {dayClasses.map((cls: any) => {
                    const rec = dayRecords.find((r: any) => r.subjectId === cls.subjectId);
                    return (
                      <div key={cls.id} className="p-2 rounded-lg text-xs" style={{ backgroundColor: cls.subject.colorHex + "20", borderLeft: `3px solid ${cls.subject.colorHex}` }}>
                        <p className="font-medium truncate">{cls.subject.name}</p>
                        <p className="text-text-muted">{cls.startTime}</p>
                        {rec && <span className={clsx("inline-block mt-0.5 w-2 h-2 rounded-full", STATUS_DOT[rec.status])} />}
                      </div>
                    );
                  })}
                  {dayClasses.length === 0 && <p className="text-xs text-text-muted text-center mt-4">No classes</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Month View */
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => <div key={d} className="text-center text-xs font-medium text-text-muted py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((date, i) => {
              if (!date) return <div key={i} />;
              const dateStr = date.toISOString().slice(0, 10);
              const dayRecords = recordMap.get(dateStr) || [];
              return (
                <div key={i} className={clsx("p-2 rounded-lg text-center min-h-[60px]",
                  isToday(date) ? "bg-primary/10 border border-primary" : "hover:bg-surface-2"
                )}>
                  <p className={clsx("text-sm", isToday(date) ? "font-bold text-primary" : "")}>{date.getDate()}</p>
                  <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                    {dayRecords.map((r: any, ri: number) => (
                      <div key={ri} className={clsx("w-2 h-2 rounded-full", STATUS_DOT[r.status])}
                        title={`${r.subject?.name}: ${r.status}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-text-muted justify-center">
            {Object.entries(STATUS_DOT).slice(0, 4).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <div className={clsx("w-2 h-2 rounded-full", v)} /> {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
