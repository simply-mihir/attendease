"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle2, XCircle, Timer } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_DOT: Record<string, string> = {
  present: "bg-green-400 shadow-green-400/50", absent: "bg-red-400 shadow-red-400/50", late: "bg-yellow-400 shadow-yellow-400/50",
  excused: "bg-purple-400 shadow-purple-400/50", cancelled: "bg-gray-600", holiday: "bg-gray-600",
};

export default function CalendarPage() {
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate week dates
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Calculate month dates
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Dynamic fetch bounds based on view
  // Add timezone buffer to from/to by grabbing the local YYYY-MM-DD
  const formatDateLocal = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 10);
  };

  const from = view === "week" ? formatDateLocal(weekDates[0]) : formatDateLocal(monthStart);
  const to = view === "week" ? formatDateLocal(weekDates[6]) : formatDateLocal(monthEnd);
  
  const { data: schedData, isLoading: schedLoading } = useSWRFetch<{ schedules: any[] }>("/schedules");
  const { data: recData, isLoading: recLoading } = useSWRFetch<{ records: any[] }>(`/attendance?from=${from}&to=${to}`);

  const schedules = schedData?.schedules || [];
  const records = recData?.records || [];
  const pageLoading = schedLoading || recLoading;

  if (pageLoading) {
    return <FuturisticLoader variant="section" title="Loading calendar" icon="🗓️" />;
  }

  function navigate(dir: number) {
    const d = new Date(currentDate);
    if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  }

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
    <PageTransition direction="left" staggerChildren={false} className="space-y-6">
      <div className="flex items-center justify-between" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 0ms forwards" }}>
        <h1 className="text-2xl font-bold text-gradient">Calendar</h1>
        <div className="flex gap-2">
          <button onClick={() => setView("week")}
            className={clsx("px-3 py-1.5 rounded-xl text-sm font-medium transition",
              view === "week" ? "btn-gradient" : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}>Week</button>
          <button onClick={() => setView("month")}
            className={clsx("px-3 py-1.5 rounded-xl text-sm font-medium transition",
              view === "month" ? "btn-gradient" : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}>Month</button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between glass rounded-2xl p-3" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 100ms forwards" }}>
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-xl transition">
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        <span className="font-semibold text-white">
          {view === "week"
            ? `${weekDates[0].toLocaleDateString("en-IN", { month: "short", day: "numeric" })} — ${weekDates[6].toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
            : currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
          }
        </span>
        <button onClick={() => navigate(1)} className="p-2 hover:bg-white/10 rounded-xl transition">
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {view === "week" ? (
        /* Week View */
        <StaggerGrid className="grid grid-cols-7 gap-2" delay={150} staggerDelay={80} animation="fadeSlideUp">
          {weekDates.map((date, i) => {
            const dayClasses = getClassesForDay(date.getDay());
            const dateStr = date.toISOString().slice(0, 10);
            const dayRecords = recordMap.get(dateStr) || [];
            return (
              <div key={i} className={clsx("glass rounded-2xl p-3 min-h-[180px]",
                isToday(date) ? "border-purple-500/50 shadow-lg shadow-purple-500/10" : ""
              )}>
                <div className="text-center mb-2">
                  <p className="text-xs text-gray-500">{DAYS[date.getDay()]}</p>
                  <p className={clsx("text-lg font-bold", isToday(date) ? "text-purple-400" : "text-white")}>{date.getDate()}</p>
                </div>
                <div className="space-y-1.5">
                  {dayClasses.map((cls: any) => {
                    const rec = dayRecords.find((r: any) => r.subjectId === cls.subjectId);
                    return (
                      <div key={cls.id} className="p-2 rounded-xl text-xs bg-white/5 backdrop-blur-sm" style={{ borderLeft: `3px solid ${cls.subject.colorHex}` }}>
                        <p className="font-medium truncate text-gray-200">{cls.subject.name}</p>
                        <p className="text-gray-500">{cls.startTime}</p>
                        {rec && <span className={clsx("inline-block mt-0.5 w-2 h-2 rounded-full shadow-sm", STATUS_DOT[rec.status])} />}
                      </div>
                    );
                  })}
                  {dayClasses.length === 0 && <p className="text-xs text-gray-600 text-center mt-4">No classes</p>}
                </div>
              </div>
            );
          })}
        </StaggerGrid>
      ) : (
        /* Month View */
        <div className="glass rounded-2xl p-4" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 150ms forwards" }}>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>)}
          </div>
          <StaggerGrid className="grid grid-cols-7 gap-1" delay={200} staggerDelay={30} animation="scaleIn">
            {monthDays.map((date, i) => {
              if (!date) return <div key={i} />;
              const dateStr = date.toISOString().slice(0, 10);
              const dayRecords = recordMap.get(dateStr) || [];
              return (
                <div key={i} className={clsx("p-2 rounded-xl text-center min-h-[60px] transition",
                  isToday(date) ? "bg-purple-500/10 border border-purple-500/50" : "hover:bg-white/5"
                )}>
                  <p className={clsx("text-sm", isToday(date) ? "font-bold text-purple-400" : "text-gray-300")}>{date.getDate()}</p>
                  <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                    {dayRecords.map((r: any, ri: number) => (
                      <div key={ri} className={clsx("w-2 h-2 rounded-full shadow-sm", STATUS_DOT[r.status])}
                        title={`${r.subject?.name}: ${r.status}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </StaggerGrid>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 justify-center">
            {Object.entries(STATUS_DOT).slice(0, 4).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <div className={clsx("w-2 h-2 rounded-full", v.split(" ")[0])} /> {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
