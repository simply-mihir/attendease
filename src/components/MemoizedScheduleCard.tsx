"use client";

import { memo } from "react";
import {
  Clock, MapPin, CheckCircle2, XCircle, Timer, Ban,
} from "lucide-react";
import clsx from "clsx";
import { SwipeableCard } from "@/components/SwipeableCard";

interface ScheduleCardProps {
  cls: any;
  marking: string | null;
  onMark: (subjectId: string, scheduleId: string, status: string) => void;
}

function ScheduleCardInner({ cls, marking, onMark }: ScheduleCardProps) {
  const currentPct = cls.currentPct ?? cls.subject?.currentPercentage ?? (
    (cls.subject?.totalClassesHeld && cls.subject.totalClassesHeld > 0)
      ? Math.round(((cls.subject.totalPresent + cls.subject.totalLate) / cls.subject.totalClassesHeld) * 100)
      : 100
  );
  const minPct = cls.minPct ?? cls.subject?.minAttendancePct ?? 75;
  const statusColor = cls.statusColor ?? (currentPct >= minPct ? "green" : (currentPct >= minPct - 10 ? "yellow" : "red"));
  
  const hasMarked = cls.attendanceMarked || (cls.attendance && cls.attendance.status);

  return (
    <div data-schedule={cls.id || cls.scheduleId}>
      <SwipeableCard
        onSwipeRight={() => onMark(cls.subjectId, cls.id || cls.scheduleId, "present")}
        onSwipeLeft={() => onMark(cls.subjectId, cls.id || cls.scheduleId, "absent")}
        disabled={!!hasMarked || !!marking}
      >
        <div className="rounded-2xl p-4 sm:p-5 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl dark:hover:bg-white/[0.07] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-1.5 h-12 rounded-full"
                style={{
                  backgroundColor: cls.colorHex || cls.subject?.colorHex,
                  boxShadow: `0 0 12px ${cls.colorHex || cls.subject?.colorHex}40`,
                }}
              />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {cls.subjectName || cls.subject?.name}
                </h3>
                <div className="flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {cls.startTime} - {cls.endTime}
                  </span>
                  {cls.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {cls.room}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span
                className={clsx(
                  "text-xl font-extrabold tracking-tight",
                  statusColor === "green" || currentPct >= minPct
                    ? "text-teal-600 dark:text-teal-400"
                    : statusColor === "yellow"
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {currentPct}%
              </span>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                min {minPct}%
              </p>
            </div>
          </div>

          {hasMarked ? (
            <div
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold",
                (cls.attendanceStatus || cls.attendance?.status) === "present"
                  ? "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20"
                  : (cls.attendanceStatus || cls.attendance?.status) === "late"
                  ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                  : (cls.attendanceStatus || cls.attendance?.status) === "cancelled"
                  ? "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20"
                  : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              Marked: {cls.attendanceStatus || cls.attendance?.status}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {(["present", "absent", "late", "cancelled"] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() =>
                      onMark(cls.subjectId, cls.id || cls.scheduleId, status)
                    }
                    disabled={marking === `${cls.subjectId}-${status}`}
                    className={clsx(
                      "py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95",
                      status === "present"
                        ? "border border-teal-200/80 bg-teal-50/50 text-teal-700 hover:bg-teal-100 hover:border-teal-300 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
                        : status === "absent"
                        ? "border border-rose-200/80 bg-rose-50/50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                        : status === "late"
                        ? "border border-amber-200/80 bg-amber-50/50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                        : "border border-slate-200/80 bg-slate-50/50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400 dark:hover:bg-slate-500/20"
                    )}
                  >
                    {status === "present" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : status === "absent" ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : status === "late" ? (
                      <Timer className="w-3.5 h-3.5" />
                    ) : (
                      <Ban className="w-3.5 h-3.5" />
                    )}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </SwipeableCard>
    </div>
  );
}

export const ScheduleCard = memo(ScheduleCardInner);
