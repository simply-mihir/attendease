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
        <div className="glass rounded-2xl p-4 hover:bg-glass-strong transition-all">
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
                <h3 className="font-semibold text-text">
                  {cls.subjectName || cls.subject?.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {cls.startTime} - {cls.endTime}
                  </span>
                  {cls.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {cls.room}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span
                className={clsx(
                  "text-xl font-bold",
                  statusColor === "green" || currentPct >= minPct
                    ? "text-green-600 dark:text-green-400"
                    : statusColor === "yellow"
                    ? "text-amber-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {currentPct}%
              </span>
              <p className="text-xs text-text-muted">
                min {minPct}%
              </p>
            </div>
          </div>

          {hasMarked ? (
            <div
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium",
                (cls.attendanceStatus || cls.attendance?.status) === "present"
                  ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                  : (cls.attendanceStatus || cls.attendance?.status) === "late"
                  ? "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20"
                  : (cls.attendanceStatus || cls.attendance?.status) === "cancelled"
                  ? "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20"
                  : "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
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
                      "py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1",
                      status === "present"
                        ? "glass border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
                        : status === "absent"
                        ? "glass border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                        : status === "late"
                        ? "glass border-amber-500/30 text-amber-600 dark:text-yellow-400 hover:bg-amber-50 dark:hover:bg-yellow-500/10"
                        : "glass border-slate-500/30 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-500/10"
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
