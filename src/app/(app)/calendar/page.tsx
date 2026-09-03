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
import { getLocalDateStr } from "@/lib/local-date";

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

  // Dynamic fetch bounds based on view (using local dates, not UTC)
  const from = view === "week" ? getLocalDateStr(weekDates[0]) : getLocalDateStr(monthStart);
  const to = view === "week" ? getLocalDateStr(weekDates[6]) : getLocalDateStr(monthEnd);
  
  const { data: schedData, isLoading: schedLoading } = useSWRFetch<{ schedules: any[] }>("/schedules");
  const { data: overData, isLoading: overLoading } = useSWRFetch<{ overrides: any[] }>(`/schedule-override?startDate=${from}&endDate=${to}`);
  const { data: recData, isLoading: recLoading } = useSWRFetch<{ records: any[] }>(`/attendance?from=${from}&to=${to}`);
  const { data: dashData } = useSWRFetch<any>("/dashboard");

  const schedules = schedData?.schedules || [];
  const overrides = overData?.overrides || [];
  const records = recData?.records || [];
  const examPeriods = dashData?.examPeriods || [];
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
    const date = getLocalDateStr(new Date(r.date));
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
      <div 
        className="group relative flex items-center justify-between mb-6 rounded-2xl border-2 p-3.5 transition-all duration-300 overflow-hidden" 
        style={{ 
          opacity: 0, 
          animation: "fadeSlideLeft 0.5s ease-out 100ms forwards",
          borderColor: "#4361ee80",
          backgroundColor: "#4361ee20",
          boxShadow: "0 6px 0 0 #4361ee60"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 4px 0 0 #4361ee60`;
          e.currentTarget.style.transform = `translateY(2px)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0 6px 0 0 #4361ee60`;
          e.currentTarget.style.transform = '';
        }}
      >
        {/* Shimmer */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, #4361ee1A 0%, #4361ee30 50%, #4361ee1A 100%)`,
            backgroundSize: "200% 200%",
            animation: "subjectCardShimmer 3s ease-in-out infinite",
          }} />

        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] pointer-events-none"
          style={{ background: `linear-gradient(to right, transparent, #4361ee99, transparent)` }} />

        <button onClick={() => navigate(-1)} className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-150 border-[#324dc7] bg-[#4361ee] text-white shadow-[0_3px_0_0_#324dc7] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#324dc7] active:translate-y-[3px] active:shadow-none cursor-pointer">
          <ChevronLeft className="w-5 h-5 drop-shadow-md" />
        </button>
        <span className="relative z-10 text-lg font-black text-[#1a1a2e] dark:text-white drop-shadow-sm tracking-wide">
          {view === "week"
            ? `${weekDates[0].toLocaleDateString("en-IN", { month: "short", day: "numeric" })} — ${weekDates[6].toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
            : currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
          }
        </span>
        <button onClick={() => navigate(1)} className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-150 border-[#324dc7] bg-[#4361ee] text-white shadow-[0_3px_0_0_#324dc7] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#324dc7] active:translate-y-[3px] active:shadow-none cursor-pointer">
          <ChevronRight className="w-5 h-5 drop-shadow-md" />
        </button>
      </div>

      {!schedData && schedLoading ? (
        <div className="py-20 flex justify-center">
          <FuturisticLoader variant="section" title="Loading Calendar..." Icon={Calendar} />
        </div>
      ) : view === "week" ? (
        /* Week View */
        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3" delay={150} staggerDelay={80} animation="fadeSlideUp">
          {weekDates.map((date, i) => {
            const dayClasses = getClassesForDay(date, schedules, overrides);
            const dateStr = getLocalDateStr(date);
            const dayRecords = recordMap.get(dateStr) || [];
            const today = isToday(date);
            
            const FALLBACK_COLORS = ["#FF2D78", "#00f5d4", "#ff6b35", "#4361ee", "#7b2cbf", "#f15bb5"];
            let prevColor: string | null = null;
            let prevSubjectId: string | null = null;
            let prevSubjectName: string | null = null;

            return (
              <div
                key={i}
                className={`rounded-2xl border-2 p-3 min-h-[180px] transition-all border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a] ${
                  today ? "border-[#FF2D78] shadow-[0_6px_0_0_#cc1a5e] bg-[#FF2D78]/5" : ""
                }`}
              >
                <div className="text-center mb-3 pb-2 border-b-2 border-gray-100 dark:border-[#2a2a3d]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] dark:text-[#6b6b80]">{DAYS[date.getDay()]}</p>
                  <p className={clsx("mt-1", today ? "text-[#FF2D78] font-extrabold text-xl" : "text-[#1a1a2e] dark:text-white font-bold text-lg")}>{date.getDate()}</p>
                </div>
                <div className="space-y-2">
                  {pageLoading ? (
                    <div className="py-8 flex justify-center">
                      <FieldLoader size="md" />
                    </div>
                  ) : (() => {
                      // Check for exams
                      const currentExam = examPeriods.find((ep: any) => {
                        if (!ep.startDate || !ep.endDate) return false;
                        const startStr = ep.startDate.split('T')[0];
                        const endStr = ep.endDate.split('T')[0];
                        const [sYear, sMonth, sDate] = startStr.split('-').map(Number);
                        const [eYear, eMonth, eDate] = endStr.split('-').map(Number);
                        const localStart = new Date(sYear, sMonth - 1, sDate);
                        const localEnd = new Date(eYear, eMonth - 1, eDate);
                        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        return checkDate >= localStart && checkDate <= localEnd;
                      });

                      if (currentExam) {
                        const examName = currentExam.name.toLowerCase().includes('exam') ? currentExam.name : `${currentExam.name} Examination`;
                        return (
                          <div className="py-6 text-center px-2">
                            <div className="mx-auto w-10 h-10 rounded-full bg-[#9b5de5]/20 flex items-center justify-center mb-2">
                               <Timer className="w-5 h-5 text-[#9b5de5]" />
                            </div>
                            <p className="text-xs font-bold text-[#1a1a2e] dark:text-white leading-tight">{examName}</p>
                            <p className="text-[10px] text-[#9b5de5] font-semibold mt-1">No Regular Classes</p>
                          </div>
                        );
                      }

                      return dayClasses.length === 0 ? (
                        <div className="py-6 text-center">
                          <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80]">No classes</p>
                        </div>
                      ) : dayClasses.map((cls: any) => {
                    const rec = dayRecords.find((r: any) => r.subjectId === cls.subjectId);
                    let color = cls.subject?.colorHex || cls.colorHex;
                    const currentSubjectId = cls.subject?.id || cls.subjectId || null;
                    const currentSubjectName = cls.subjectName;

                    const isSameSubject = (currentSubjectId && currentSubjectId === prevSubjectId) || (!currentSubjectId && currentSubjectName === prevSubjectName);

                    if (!color) {
                      let hash = 0;
                      const name = currentSubjectName || "unknown";
                      for (let j = 0; j < name.length; j++) hash = name.charCodeAt(j) + ((hash << 5) - hash);
                      color = FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
                    }

                    if (!isSameSubject && color === prevColor) {
                      let hash = 0;
                      const name = currentSubjectName || "unknown";
                      for (let j = 0; j < name.length; j++) hash = name.charCodeAt(j) + ((hash << 5) - hash);
                      let index = Math.abs(hash) % FALLBACK_COLORS.length;
                      
                      while (FALLBACK_COLORS[index] === prevColor || (FALLBACK_COLORS[index] === color && FALLBACK_COLORS.length > 1)) {
                        index = (index + 1) % FALLBACK_COLORS.length;
                      }
                      color = FALLBACK_COLORS[index];
                    }

                    prevColor = color;
                    prevSubjectId = currentSubjectId;
                    prevSubjectName = currentSubjectName;

                    return (
                      <div 
                        key={cls.id || cls.subjectId + cls.startTime} 
                        className="group relative rounded-xl border-2 px-2.5 py-2 transition-all duration-300 cursor-pointer overflow-hidden" 
                        style={{ 
                          borderLeftWidth: "4px", 
                          borderLeftColor: color,
                          borderColor: `${color}80`,
                          backgroundColor: `${color}25`,
                          boxShadow: `0 3px 0 0 ${color}60`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = `0 1px 0 0 ${color}60`;
                          e.currentTarget.style.transform = `translateY(2px)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = `0 3px 0 0 ${color}60`;
                          e.currentTarget.style.transform = '';
                        }}
                      >
                        {/* Shimmer */}
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{
                            background: `linear-gradient(135deg, ${color}1A 0%, ${color}30 50%, ${color}1A 100%)`,
                            backgroundSize: "200% 200%",
                            animation: "subjectCardShimmer 3s ease-in-out infinite",
                          }} />
                          
                        <div className="relative z-10">
                          <p className="text-xs font-black text-[#1a1a2e] dark:text-white break-words leading-tight">{cls.subjectName}</p>
                          <p className="text-[10px] font-bold text-[#9ca3af] dark:text-[#6b6b80] mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {cls.startTime}
                          </p>
                          {cls.isOverride && (
                            <span className={clsx("inline-block rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider mt-1.5",
                              cls.overrideType === "extra"
                                ? "bg-[#06d6a0]/20 text-[#06d6a0]"
                                : cls.overrideType === "swapped"
                                ? "bg-[#4361ee]/20 text-[#4361ee]"
                                : "bg-[#ff6b35]/20 text-[#ff6b35]"
                            )}>
                              {cls.overrideType}
                            </span>
                          )}
                          {rec && <span className={clsx("inline-block mt-2 w-3 h-3 rounded-full block shadow-sm border border-black/10 dark:border-white/10", STATUS_DOT[rec.status])} />}
                        </div>
                      </div>
                    );
                  })})()}
                  {dayClasses.length === 0 && !pageLoading && !examPeriods.find((ep: any) => {
                        if (!ep.startDate || !ep.endDate) return false;
                        const startStr = ep.startDate.split('T')[0];
                        const endStr = ep.endDate.split('T')[0];
                        const [sYear, sMonth, sDate] = startStr.split('-').map(Number);
                        const [eYear, eMonth, eDate] = endStr.split('-').map(Number);
                        const localStart = new Date(sYear, sMonth - 1, sDate);
                        const localEnd = new Date(eYear, eMonth - 1, eDate);
                        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        return checkDate >= localStart && checkDate <= localEnd;
                  }) && <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80] text-center mt-6">No classes</p>}
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
              const dateStr = getLocalDateStr(date);
              const dayClasses = getClassesForDay(date, schedules, overrides);
              const dayRecords = recordMap.get(dateStr) || [];
              const today = isToday(date);
              
              const currentExam = examPeriods.find((ep: any) => {
                if (!ep.startDate || !ep.endDate) return false;
                const startStr = ep.startDate.split('T')[0];
                const endStr = ep.endDate.split('T')[0];
                const [sYear, sMonth, sDate] = startStr.split('-').map(Number);
                const [eYear, eMonth, eDate] = endStr.split('-').map(Number);
                const localStart = new Date(sYear, sMonth - 1, sDate);
                const localEnd = new Date(eYear, eMonth - 1, eDate);
                const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                return checkDate >= localStart && checkDate <= localEnd;
              });

              return (
                <div key={i} className={clsx("group relative p-2 rounded-xl text-center min-h-[64px] border-2 transition cursor-pointer",
                  today
                    ? "bg-[#FF2D78]/10 border-[#FF2D78] shadow-[0_3px_0_0_#FF2D78]"
                    : currentExam
                    ? "bg-[#9b5de5]/10 border-[#9b5de5]/40 shadow-[0_3px_0_0_rgba(155,93,229,0.3)] hover:border-[#9b5de5]/60"
                    : "bg-gray-50 dark:bg-[#0d0d1a] border-gray-200 dark:border-[#2a2a3d]/50 hover:border-gray-400 dark:hover:border-gray-600"
                )}>
                  <p className={today ? "text-[#FF2D78] font-extrabold text-sm" : currentExam ? "text-[#9b5de5] font-extrabold text-sm" : "text-[#1a1a2e] dark:text-white font-bold text-sm"}>{date.getDate()}</p>
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

                  {/* Tooltip */}
                  {(dayClasses.length > 0 || currentExam) && !pageLoading && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 rounded-xl bg-white dark:bg-[#141425] border-2 border-gray-200 dark:border-[#2a2a3d] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] scale-95 group-hover:scale-100 pointer-events-none">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#9ca3af] dark:text-[#6b6b80] mb-2 border-b-2 border-gray-100 dark:border-[#2a2a3d] pb-1.5">
                        {date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </p>
                      <div className="space-y-2 text-left max-h-[150px] overflow-y-auto scrollbar-none">
                        {currentExam ? (
                          <div className="flex items-start gap-2">
                             <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 shadow-sm bg-[#9b5de5]" />
                             <div>
                               <p className="text-xs font-bold text-[#1a1a2e] dark:text-white leading-tight">
                                 {currentExam.name.toLowerCase().includes('exam') ? currentExam.name : `${currentExam.name} Examination`}
                               </p>
                               <p className="text-[10px] font-semibold text-[#9b5de5] mt-0.5">No Regular Classes</p>
                             </div>
                           </div>
                        ) : dayClasses.map((cls: any, ci: number) => {
                           const color = cls.subject?.colorHex || cls.colorHex || '#FF2D78';
                           return (
                             <div key={ci} className="flex items-start gap-2">
                               <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                               <div>
                                 <p className="text-xs font-bold text-[#1a1a2e] dark:text-white leading-tight line-clamp-2">{cls.subjectName}</p>
                                 <p className="text-[10px] font-semibold text-[#9ca3af] dark:text-[#6b6b80] mt-0.5">{cls.startTime}</p>
                               </div>
                             </div>
                           )
                        })}
                      </div>
                      
                      {/* Triangle pointer */}
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white dark:bg-[#141425] border-b-2 border-r-2 border-gray-200 dark:border-[#2a2a3d] rotate-45" />
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
