"use client";

import { memo, useState, useEffect, useRef } from "react";
import {
  Clock, MapPin, CheckCircle2, XCircle, Timer, Ban, Check,
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

  const hasMarked = cls.attendanceMarked || (cls.attendance && cls.attendance.status);

  // Optimistic animation state
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; status: string } | null>(null);
  const prevMarking = useRef(marking);

  // Detect when marking completes (marking goes from truthy to null) → show success
  useEffect(() => {
    if (prevMarking.current && !marking && optimisticStatus) {
      setShowSuccess(true);
      const t = setTimeout(() => {
        setShowSuccess(false);
        setOptimisticStatus(null);
      }, 2000);
      return () => clearTimeout(t);
    }
    prevMarking.current = marking;
  }, [marking, optimisticStatus]);

  // Clear optimistic state when real data arrives
  useEffect(() => {
    if (hasMarked) {
      setOptimisticStatus(null);
      setShowSuccess(false);
    }
  }, [hasMarked]);

  function handleClick(e: React.MouseEvent, status: string) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, status });
    setTimeout(() => setRipple(null), 600);

    setOptimisticStatus(status);
    if (navigator.vibrate) navigator.vibrate(30);
    onMark(cls.subjectId, cls.id || cls.scheduleId, status);
  }

  function handleSwipe(status: string) {
    setOptimisticStatus(status);
    onMark(cls.subjectId, cls.id || cls.scheduleId, status);
  }

  const isMarking = !!optimisticStatus && !!marking;
  const displayStatus = hasMarked
    ? (cls.attendanceStatus || cls.attendance?.status)
    : showSuccess ? optimisticStatus : null;

  // Color map for statuses
  const statusStyles: Record<string, { border: string; bg: string; text: string; darkText?: string }> = {
    present:   { border: "rgba(0,245,212,0.4)", bg: "rgba(0,245,212,0.12)", text: "#00c4a7", darkText: "#00f5d4" },
    absent:    { border: "rgba(239,71,111,0.4)", bg: "rgba(239,71,111,0.12)", text: "#ef476f" },
    late:      { border: "rgba(250,204,21,0.4)", bg: "rgba(250,204,21,0.12)", text: "#ca8a04", darkText: "#fef08a" },
    cancelled: { border: "rgba(156,163,175,0.3)", bg: "rgba(156,163,175,0.08)", text: "#6b7280", darkText: "#9ca3af" },
  };

  const activeStyle = statusStyles[displayStatus || optimisticStatus || "present"];

  return (
    <div data-schedule={cls.id || cls.scheduleId} className="h-full">
      <SwipeableCard
        onSwipeRight={() => handleSwipe("present")}
        onSwipeLeft={() => handleSwipe("absent")}
        disabled={!!hasMarked || !!marking || !!optimisticStatus}
      >
        <div
          className={clsx(
            "relative rounded-2xl border-2 p-4 sm:p-5 overflow-hidden flex flex-col h-full",
            "transition-all duration-300 ease-out",
            isMarking && "scale-[0.98]",
          )}
          style={{
            borderColor: `${cls.colorHex || cls.subject?.colorHex || "#FF2D78"}40`,
            backgroundColor: `${cls.colorHex || cls.subject?.colorHex || "#FF2D78"}0D`,
            boxShadow: `0 6px 0 0 ${cls.colorHex || cls.subject?.colorHex || "#FF2D78"}30`,
          }}
        >
          {/* Top accent line */}
          <div className="absolute inset-x-0 top-0 h-[2px]"
            style={{ background: `linear-gradient(to right, transparent, ${cls.colorHex || cls.subject?.colorHex || "#FF2D78"}60, transparent)` }} />

          {/* Card header */}
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

          {/* Bottom action area — 3 states */}
          <div className="mt-auto pt-2 w-full">
            {(hasMarked || displayStatus) ? (
              /* ── STATE 3: Marked (real or optimistic success) ── */
              <div
                className={clsx(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black border-2 w-full transition-all duration-300",
                  showSuccess && !hasMarked && "mark-success-enter",
                )}
                style={{
                  borderColor: activeStyle.border,
                  backgroundColor: activeStyle.bg,
                  color: activeStyle.text,
                }}
              >
                {showSuccess && !hasMarked ? (
                  <span className="mark-checkmark-pop"><Check className="w-4 h-4" /></span>
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                Marked: {displayStatus}
              </div>
            ) : isMarking ? (
              /* ── STATE 2: Marking in progress ── */
              <div
                className="flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black border-2 w-full mark-pulse-bar"
                style={{
                  borderColor: activeStyle.border,
                  backgroundColor: activeStyle.bg,
                  color: activeStyle.text,
                }}
              >
                <span className="mark-spinner" />
                Marking {optimisticStatus}…
              </div>
            ) : (
              /* ── STATE 1: Unmarked — show buttons ── */
              <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                {(["present", "absent", "late", "cancelled"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={(e) => handleClick(e, status)}
                      disabled={!!marking || !!optimisticStatus}
                      className={clsx(
                        "flex-1 py-2 px-0.5 sm:px-1 rounded-xl text-[9px] sm:text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer min-w-0 leading-none relative overflow-hidden",
                        "transition-all duration-200 active:scale-90",
                        status === "present"
                          ? "btn-3d-cyan"
                          : status === "absent"
                          ? "btn-3d-coral"
                          : status === "late"
                          ? "btn-3d-yellow"
                          : "btn-3d-truegray"
                      )}
                    >
                      {/* Ripple */}
                      {ripple && ripple.status === status && (
                        <span
                          className="mark-ripple absolute rounded-full pointer-events-none"
                          style={{ left: ripple.x, top: ripple.y }}
                        />
                      )}
                      {status === "present" ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : status === "absent" ? (
                        <XCircle className="w-4 h-4 shrink-0" />
                      ) : status === "late" ? (
                        <Timer className="w-4 h-4 shrink-0" />
                      ) : (
                        <Ban className="w-4 h-4 shrink-0" />
                      )}
                      <span className="text-center w-full whitespace-nowrap tracking-tighter" style={{ fontSize: status === 'cancelled' ? 'clamp(8px, 2.5vw, 11px)' : 'inherit' }}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </SwipeableCard>
    </div>
  );
}

export const ScheduleCard = memo(ScheduleCardInner);
