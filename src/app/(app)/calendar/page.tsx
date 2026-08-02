"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle2, XCircle, Timer , Calendar } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_DOT: Record<string, string> = {
  present: "bg-[#06d6a0] shadow-[0_2px_0_0_#038c67]",
  absent: "bg-[#ef476f] shadow-[0_2px_0_0_#cc1a42]",
  late: "bg-[#ff6b35] shadow-[0_2px_0_0_#d95220]",
  excused: "bg-[#7b2cbf] dark:bg-[#c77dff] shadow-[0_2px_0_0_#5a189a]",
  cancelled: "bg-gray-400 dark:bg-gray-600",
  holiday: "bg-gray-400 dark:bg-gray-600",
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
    return <FuturisticLoader variant="section" title="Loading calendar" Icon={Calendar} />;
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
        <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">Calendar</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("week")}
            className={clsx(
              "px-4 py-1.5 text-xs font-black transition-all cursor-pointer",
              view === "week" ? "btn-3d-primary" : "btn-3d-secondary"
            )}
          >
            Week
          </button>
          <button
            onClick={() => setView("month")}
            className={clsx(
              "px-4 py-1.5 text-xs font-black transition-all cursor-pointer",
              view === "month" ? "btn-3d-primary" : "btn-3d-secondary"
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between card-3d p-3.5 transition-all" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 100ms forwards" }}>
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition cursor-pointer">
          <ChevronLeft className="w-5 h-5 text-[#4a4a5a] dark:text-[#a0a0b0]" />
        </button>
        <span className="font-black text-text text-sm sm:text-base">
          {view === "week"
            ? `${weekDates[0].toLocaleDateString("en-IN", { month: "short", day: "numeric" })} — ${weekDates[6].toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
            : currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
          }
        </span>
        <button onClick={() => navigate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition cursor-pointer">
          <ChevronRight className="w-5 h-5 text-[#4a4a5a] dark:text-[#a0a0b0]" />
        </button>
      </div>

      {view === "week" ? (
        /* Week View */
        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3" delay={150} staggerDelay={80} animation="fadeSlideUp">
          {weekDates.map((date, i) => {
            const dayClasses = getClassesForDay(date.getDay());
            const dateStr = date.toISOString().slice(0, 10);
            const dayRecords = recordMap.get(dateStr) || [];
            const today = isToday(date);
            return (
              <div
                key={i}
                className={clsx(
                  "card-3d p-3 min-h-[180px] transition-all",
                  today && "border-[#FF2D78] shadow-[0_6px_0_0_#FF2D78] bg-[#FF2D78]/5"
                )}
              >
                <div className="text-center mb-2.5 pb-2 border-b-2 border-gray-100 dark:border-[#2a2a3d]">
                  <p className="text-xs font-black text-text-muted">{DAYS[date.getDay()]}</p>
                  <p className={clsx("text-lg font-black", today ? "text-[#FF2D78]" : "text-text")}>{date.getDate()}</p>
                </div>
                <div className="space-y-1.5">
                  {dayClasses.map((cls: any) => {
                    const rec = dayRecords.find((r: any) => r.subjectId === cls.subjectId);
                    return (
                      <div key={cls.id} className="p-2 rounded-xl text-xs bg-gray-50 dark:bg-[#0f0f1c] border-2 border-gray-200 dark:border-[#2a2a3d]" style={{ borderLeft: `4px solid ${cls.subject.colorHex || '#FF2D78'}` }}>
                        <p className="font-black truncate text-text">{cls.subject.name}</p>
                        <p className="text-text-muted font-mono font-bold text-[11px] mt-0.5">{cls.startTime}</p>
                        {rec && <span className={clsx("inline-block mt-1 w-2.5 h-2.5 rounded-full", STATUS_DOT[rec.status])} />}
                      </div>
                    );
                  })}
                  {dayClasses.length === 0 && <p className="text-xs text-text-muted text-center mt-6 font-bold">No classes</p>}
                </div>
              </div>
            );
          })}
        </StaggerGrid>
      ) : (
        /* Month View */
        <div className="card-3d p-5" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 150ms forwards" }}>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => <div key={d} className="text-center text-xs font-black text-text-muted py-1">{d}</div>)}
          </div>
          <StaggerGrid className="grid grid-cols-7 gap-2" delay={200} staggerDelay={30} animation="scaleIn">
            {monthDays.map((date, i) => {
              if (!date) return <div key={i} />;
              const dateStr = date.toISOString().slice(0, 10);
              const dayRecords = recordMap.get(dateStr) || [];
              const today = isToday(date);
              return (
                <div key={i} className={clsx("p-2 rounded-xl text-center min-h-[64px] border-2 transition",
                  today
                    ? "bg-[#FF2D78]/10 border-[#FF2D78] shadow-[0_3px_0_0_#FF2D78]"
                    : "bg-gray-50 dark:bg-[#0f0f1c] border-gray-200 dark:border-[#2a2a3d] hover:border-gray-400"
                )}>
                  <p className={clsx("text-sm font-black", today ? "text-[#FF2D78]" : "text-text")}>{date.getDate()}</p>
                  <div className="flex justify-center gap-1 mt-1.5 flex-wrap">
                    {dayRecords.map((r: any, ri: number) => (
                      <div key={ri} className={clsx("w-2 h-2 rounded-full", STATUS_DOT[r.status])}
                        title={`${r.subject?.name}: ${r.status}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </StaggerGrid>
          <div className="flex items-center gap-4 mt-6 text-xs font-bold text-text-muted justify-center flex-wrap">
            {Object.entries(STATUS_DOT).slice(0, 4).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <div className={clsx("w-2.5 h-2.5 rounded-full", v.split(" ")[0])} /> <span className="capitalize">{k}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
