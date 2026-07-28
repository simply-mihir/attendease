"use client";

import { memo } from "react";
import {
  Clock, MapPin, CheckCircle2, XCircle, Timer, Ban,
} from "lucide-react";
import clsx from "clsx";

interface ScheduleCardProps {
  cls: any;
  marking: string | null;
  onMark: (subjectId: string, scheduleId: string, status: string) => void;
}

function ScheduleCardInner({ cls, marking, onMark }: ScheduleCardProps) {
  return (
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
              (cls.currentPct >= cls.minPct || cls.statusColor === "green")
                ? "text-green-400"
                : cls.statusColor === "yellow"
                ? "text-yellow-400"
                : "text-red-400"
            )}
          >
            {cls.currentPct ?? cls.subject?.currentPercentage ?? 0}%
          </span>
          <p className="text-xs text-text-muted">
            min {cls.minPct ?? cls.subject?.minAttendancePct ?? 75}%
          </p>
        </div>
      </div>

      {cls.attendanceMarked || (cls.attendance && cls.attendance.status) ? (
        <div
          className={clsx(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium",
            (cls.attendanceStatus || cls.attendance?.status) === "present"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : (cls.attendanceStatus || cls.attendance?.status) === "late"
              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              : (cls.attendanceStatus || cls.attendance?.status) === "cancelled"
              ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
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
                  "py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1",
                  status === "present"
                    ? "glass border-green-500/20 text-green-400 hover:bg-green-500/10"
                    : status === "absent"
                    ? "glass border-red-500/20 text-red-400 hover:bg-red-500/10"
                    : status === "late"
                    ? "glass border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
                    : "glass border-slate-500/20 text-slate-400 hover:bg-slate-500/10"
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
  );
}

export const ScheduleCard = memo(ScheduleCardInner);
