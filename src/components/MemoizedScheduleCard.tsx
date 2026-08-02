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
        <div className="card-3d p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-12 rounded-full shadow-sm"
                style={{
                  backgroundColor: cls.colorHex || cls.subject?.colorHex || "#FF2D78",
                }}
              />
              <div>
                <h3 className="font-extrabold text-[#1a1a2e] dark:text-white">
                  {cls.subjectName || cls.subject?.name}
                </h3>
                <div className="flex items-center gap-3 text-xs font-semibold text-[#4a4a5a] dark:text-[#6b6b80] mt-1">
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
                  "text-xl font-black tracking-tight",
                  statusColor === "green" || currentPct >= minPct
                    ? "text-[#06d6a0]"
                    : statusColor === "yellow"
                    ? "text-[#ff6b35]"
                    : "text-[#ef476f]"
                )}
              >
                {currentPct}%
              </span>
              <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#6b6b80]">
                min {minPct}%
              </p>
            </div>
          </div>

          {hasMarked ? (
            <div
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 shadow-[0_2px_0_0_rgba(0,0,0,0.1)]",
                (cls.attendanceStatus || cls.attendance?.status) === "present"
                  ? "bg-[#06d6a0]/15 text-[#06d6a0] border-[#06d6a0]/40"
                  : (cls.attendanceStatus || cls.attendance?.status) === "late"
                  ? "bg-[#ff6b35]/15 text-[#ff6b35] border-[#ff6b35]/40"
                  : (cls.attendanceStatus || cls.attendance?.status) === "cancelled"
                  ? "bg-gray-100 text-gray-700 border-gray-300 dark:bg-white/10 dark:text-gray-300 dark:border-white/20"
                  : "bg-[#ef476f]/15 text-[#ef476f] border-[#ef476f]/40"
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
                      "py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all",
                      status === "present"
                        ? "btn-3d-teal"
                        : status === "absent"
                        ? "btn-3d-coral"
                        : status === "late"
                        ? "btn-3d-orange"
                        : "btn-3d-secondary"
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
