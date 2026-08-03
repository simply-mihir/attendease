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
        <div 
          className="relative rounded-2xl border-2 p-4 sm:p-5 transition-all duration-150 overflow-hidden"
          style={{
            borderColor: `${cls.colorHex || cls.subject?.colorHex || "#FF2D78"}40`,
            backgroundColor: `${cls.colorHex || cls.subject?.colorHex || "#FF2D78"}0D`,
            boxShadow: `0 6px 0 0 ${cls.colorHex || cls.subject?.colorHex || "#FF2D78"}30`,
          }}
        >
          {/* Top accent line */}
          <div className="absolute inset-x-0 top-0 h-[2px]"
            style={{ background: `linear-gradient(to right, transparent, ${cls.colorHex || cls.subject?.colorHex || "#FF2D78"}60, transparent)` }} />

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 pr-3">
              <h3 
                className="text-xs font-bold uppercase tracking-wider break-words"
                style={{ color: cls.colorHex || cls.subject?.colorHex || "#FF2D78" }}
              >
                {cls.subjectName || cls.subject?.name}
              </h3>
              <div className="flex flex-col gap-1.5 text-xs font-semibold text-[#4a4a5a] dark:text-[#6b6b80] mt-3">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {cls.startTime} - {cls.endTime}
                </span>
                {cls.room && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {cls.room}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-[#1a1a2e] dark:text-white block mb-1">
                {currentPct}%
              </span>
              <span className="text-[10px] font-bold text-[#9ca3af] dark:text-[#6b6b80] uppercase tracking-wider bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
                min {minPct}%
              </span>
            </div>
          </div>

          {hasMarked ? (
            <div
              className={clsx(
                "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black border-2 shadow-[0_2px_0_0_rgba(0,0,0,0.1)] w-full mt-3",
                (cls.attendanceStatus || cls.attendance?.status) === "present"
                  ? "bg-[#00f5d4]/15 text-[#00c4a7] border-[#00f5d4]/40 dark:text-[#00f5d4]"
                  : (cls.attendanceStatus || cls.attendance?.status) === "late"
                  ? "bg-[#facc15]/15 text-[#ca8a04] border-[#facc15]/40 dark:text-[#fef08a]"
                  : (cls.attendanceStatus || cls.attendance?.status) === "cancelled"
                  ? "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-500/10 dark:text-gray-300 dark:border-gray-500/20"
                  : "bg-[#ef476f]/15 text-[#ef476f] border-[#ef476f]/40"
              )}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Marked: {cls.attendanceStatus || cls.attendance?.status}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 mt-3 w-full">
              {(["present", "absent", "late", "cancelled"] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() =>
                      onMark(cls.subjectId, cls.id || cls.scheduleId, status)
                    }
                    disabled={marking === `${cls.subjectId}-${status}`}
                    className={clsx(
                      "flex-1 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl text-[9px] sm:text-xs font-bold flex flex-col xl:flex-row items-center justify-center gap-0.5 sm:gap-1.5 cursor-pointer transition-all min-w-0",
                      status === "present"
                        ? "btn-3d-cyan"
                        : status === "absent"
                        ? "btn-3d-coral"
                        : status === "late"
                        ? "btn-3d-yellow"
                        : "btn-3d-truegray"
                    )}
                  >
                    {status === "present" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    ) : status === "absent" ? (
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    ) : status === "late" ? (
                      <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    ) : (
                      <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    )}
                    <span className="truncate max-w-full">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
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
