"use client";
import { useState, useMemo, useEffect } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle2, XCircle, Timer , Calendar } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";
import { getClassesForDay } from "@/lib/schedule-utils";
import { invalidatePrefix } from "@/hooks/useSWRFetch";

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
  const { data: overData, isLoading: overLoading } = useSWRFetch<{ overrides: any[] }>(`/schedule-override?startDate=${from}&endDate=${to}`);
  const { data: recData, isLoading: recLoading } = useSWRFetch<{ records: any[] }>(`/attendance?from=${from}&to=${to}`);

  const schedules = schedData?.schedules || [];
  const overrides = overData?.overrides || [];
  const records = recData?.records || [];
  const pageLoading = schedLoading || recLoading || overLoading;


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

  useEffect(() => {
    const handler = () => {
      invalidatePrefix("/schedule-override");
      invalidatePrefix("/schedules");
    };
    window.addEventListener("scheduleOverrideChanged", handler);
    return () => window.removeEventListener("scheduleOverrideChanged", handler);
  }, []);

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  return (
    <PageTransition direction="left" staggerChildren={false} className="space-y-6">
      <div className="flex items-center justify-between mb-6" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 0ms forwards" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4361ee]/10">
            <Calendar className="h-6 w-6 text-[#4361ee]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1a1a2e] dark:text-white">Calendar</h1>
        </div>
        <div className="flex rounded-xl border-2 overflow-hidden border-gray-200 shadow-[0_3px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:shadow-[0_3px_0_0_#0d0d1a]">
          <button
            onClick={() => setView("week")}
            className={`px-5 py-2 text-sm font-bold transition-all duration-150 cursor-pointer ${view === "week" ? "bg-[#FF2D78] text-white" : "bg-white text-[#4a4a5a] hover:bg-gray-50 dark:bg-[#141425] dark:text-[#c4c4d4]"}`}
          >
            Week
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-5 py-2 text-sm font-bold transition-all duration-150 cursor-pointer ${view === "month" ? "bg-[#FF2D78] text-white" : "bg-white text-[#4a4a5a] hover:bg-gray-50 dark:bg-[#141425] dark:text-[#c4c4d4]"}`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6 rounded-2xl border-2 p-3.5 border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 100ms forwards" }}>
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-150 border-gray-200 bg-white text-[#4a4a5a] shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_3px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a] cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-extrabold text-[#1a1a2e] dark:text-white">
          {view === "week"
            ? `${weekDates[0].toLocaleDateString("en-IN", { month: "short", day: "numeric" })} — ${weekDates[6].toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
            : currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
          }
        </span>
        <button onClick={() => navigate(1)} className="flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-150 border-gray-200 bg-white text-[#4a4a5a] shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_3px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a] cursor-pointer">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {view === "week" ? (
        /* Week View */
        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3" delay={150} staggerDelay={80} animation="fadeSlideUp">
          {weekDates.map((date, i) => {
            const dayClasses = getClassesForDay(date, schedules, overrides);
            const dateStr = date.toISOString().slice(0, 10);
            const dayRecords = recordMap.get(dateStr) || [];
            const today = isToday(date);
            return (
              <div
                key={i}
                className={`rounded-2xl border-2 p-3 min-h-[180px] transition-all border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a] ${
                  today ? "border-[#FF2D78] shadow-[0_6px_0_0_#cc1a5e] bg-[#FF2D78]/5" : ""
                }`}
              >
                <div className="text-center mb-2.5 pb-2 border-b-2 border-gray-100 dark:border-[#2a2a3d]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b6b80]">{DAYS[date.getDay()]}</p>
                  <p className={clsx("mt-1", today ? "text-[#FF2D78] font-extrabold text-lg" : "text-[#1a1a2e] dark:text-white font-bold text-lg")}>{date.getDate()}</p>
                </div>
                <div className="space-y-1.5">
                  {pageLoading ? (
                    <div className="py-8 flex justify-center">
                      <FieldLoader size="md" />
                    </div>
                  ) : dayClasses.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80]">No classes</p>
                    </div>
                  ) : dayClasses.map((cls: any) => {
                    const rec = dayRecords.find((r: any) => r.subjectId === cls.subjectId);
                    return (
                      <div key={cls.id || cls.subjectId + cls.startTime} className="rounded-lg border-2 px-2 py-1.5 mb-1 transition-all duration-150 cursor-pointer border-gray-200 bg-white shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_3px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a]" style={{ borderLeftWidth: "4px", borderLeftColor: cls.subject?.colorHex || cls.colorHex || '#FF2D78' }}>
                        <p className="text-xs font-bold text-[#1a1a2e] dark:text-white break-words">{cls.subjectName}</p>
                        <p className="text-[10px] text-[#9ca3af] dark:text-[#6b6b80]">{cls.startTime}</p>
                        {cls.isOverride && (
                          <span className={clsx("inline-block rounded px-1 py-0.5 text-[8px] font-bold uppercase mt-0.5",
                            cls.overrideType === "extra"
                              ? "bg-[#06d6a0]/20 text-[#06d6a0]"
                              : cls.overrideType === "swapped"
                              ? "bg-[#4361ee]/20 text-[#4361ee]"
                              : "bg-[#ff6b35]/20 text-[#ff6b35]"
                          )}>
                            {cls.overrideType}
                          </span>
                        )}
                        {rec && <span className={clsx("inline-block mt-1 w-2.5 h-2.5 rounded-full block", STATUS_DOT[rec.status])} />}
                      </div>
                    );
                  })}
                  {dayClasses.length === 0 && !pageLoading && <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80] text-center mt-6">No classes</p>}
                </div>
              </div>
            );
          })}
        </StaggerGrid>
      ) : (
        /* Month View */
        <div className="rounded-2xl border-2 p-5 border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 150ms forwards" }}>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => <div key={d} className="text-center text-xs font-bold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b6b80] py-1">{d}</div>)}
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
                    : "bg-gray-50 dark:bg-[#0d0d1a] border-gray-200 dark:border-[#2a2a3d]/50 hover:border-gray-400 dark:hover:border-gray-600"
                )}>
                  <p className={today ? "text-[#FF2D78] font-extrabold text-sm" : "text-[#1a1a2e] dark:text-white font-bold text-sm"}>{date.getDate()}</p>
                  {pageLoading ? (
                    <div className="flex justify-center mt-2">
                      <FieldLoader size="sm" />
                    </div>
                  ) : (
                    <div className="flex justify-center gap-1 mt-1.5 flex-wrap">
                      {dayRecords.map((r: any, ri: number) => (
                        <div key={ri} className={clsx("w-2 h-2 rounded-full", STATUS_DOT[r.status])}
                          title={`${r.subject?.name}: ${r.status}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </StaggerGrid>
          <div className="flex items-center gap-4 mt-6 text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] justify-center flex-wrap">
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
