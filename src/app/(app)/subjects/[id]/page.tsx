"use client";
import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { apiFetch } from "@/hooks/useApi";
import { calculateAttendance } from "@/lib/attendance-calc";
import {
  ArrowLeft, Clock, MapPin, Flame, CheckCircle2, XCircle, Timer,
  Edit2, Trash2, Calendar as CalIcon
} from "lucide-react";
import clsx from "clsx";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const STATUS_COLORS: Record<string, string> = {
  present: "bg-success/10 text-success",
  absent: "bg-danger/10 text-danger",
  late: "bg-warning/10 text-warning",
  excused: "bg-primary/10 text-primary",
  cancelled: "bg-surface-3 text-text-muted",
  holiday: "bg-surface-3 text-text-muted",
};

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [subject, setSubject] = useState<any>(null);
  const [marking, setMarking] = useState(false);
  const [markDate, setMarkDate] = useState(new Date().toISOString().slice(0, 10));
  const [markStatus, setMarkStatus] = useState("present");

  const load = useCallback(async () => {
    const data = await apiFetch(`/subjects/${id}`);
    setSubject(data.subject);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!subject) return <div className="text-center py-16 text-text-muted">Loading...</div>;

  const stats = calculateAttendance({
    totalClasses: subject.totalClassesHeld,
    totalPresent: subject.totalPresent,
    totalLate: subject.totalLate,
    totalAbsent: subject.totalAbsent,
    totalExcused: subject.totalExcused,
    minRequiredPct: subject.minAttendancePct,
  });

  async function handleMark() {
    setMarking(true);
    try {
      await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({ subjectId: id, date: markDate, status: markStatus }),
      });
      await load();
    } catch (err) { console.error(err); }
    finally { setMarking(false); }
  }

  async function deleteRecord(recordId: string) {
    if (!confirm("Delete this record?")) return;
    await apiFetch(`/attendance/${recordId}`, { method: "DELETE" });
    await load();
  }

  // Progress ring SVG
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (stats.currentPercentage / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Link href="/subjects" className="flex items-center gap-2 text-text-secondary text-sm hover:text-text transition">
        <ArrowLeft className="w-4 h-4" /> Back to Subjects
      </Link>

      {/* Header */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-4 h-16 rounded-full" style={{ backgroundColor: subject.colorHex }} />
            <div>
              <h1 className="text-2xl font-bold">{subject.name}</h1>
              <p className="text-text-secondary text-sm">{subject.code} {subject.instructorName && `· ${subject.instructorName}`}</p>
              {subject.semester && <p className="text-xs text-text-muted mt-1">{subject.semester.name}</p>}
            </div>
          </div>
          {/* Progress ring */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="8" />
              <circle cx="50" cy="50" r={radius} fill="none"
                stroke={stats.statusColor === "green" ? "var(--color-success)" : stats.statusColor === "yellow" ? "var(--color-warning)" : "var(--color-danger)"}
                strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                className="progress-ring transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={clsx("text-lg font-bold", stats.statusColor === "green" ? "text-success" : stats.statusColor === "yellow" ? "text-warning" : "text-danger")}>
                {stats.currentPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-surface-2 rounded-lg">
            <p className="text-2xl font-bold">{subject.totalClassesHeld}</p>
            <p className="text-xs text-text-muted">Total</p>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <p className="text-2xl font-bold text-success">{subject.totalPresent}</p>
            <p className="text-xs text-text-muted">Present</p>
          </div>
          <div className="text-center p-3 bg-danger/10 rounded-lg">
            <p className="text-2xl font-bold text-danger">{subject.totalAbsent}</p>
            <p className="text-xs text-text-muted">Absent</p>
          </div>
          <div className="text-center p-3 bg-warning/10 rounded-lg">
            <p className="text-2xl font-bold text-warning">{subject.totalLate}</p>
            <p className="text-xs text-text-muted">Late</p>
          </div>
        </div>
      </div>

      {/* Bunk Calculator + Streak */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={clsx("rounded-xl border p-5",
          stats.statusColor === "red" ? "bg-danger/5 border-danger/30" : "bg-success/5 border-success/30"
        )}>
          <h3 className="font-semibold mb-2">
            {stats.isInDanger ? "Recovery Plan" : "Bunk Calculator"}
          </h3>
          <p className={clsx("text-3xl font-bold mb-1", stats.isInDanger ? "text-danger" : "text-success")}>
            {stats.isInDanger ? stats.mustAttendCount : stats.canSkipCount}
          </p>
          <p className="text-sm text-text-secondary">
            {stats.isInDanger
              ? `consecutive classes needed to reach ${subject.minAttendancePct}%`
              : `classes you can still skip safely`}
          </p>
        </div>
        <div className="bg-warning/5 border border-warning/30 rounded-xl p-5">
          <h3 className="font-semibold mb-2">Streak</h3>
          <p className="text-3xl font-bold text-warning flex items-center gap-2">
            <Flame className="w-8 h-8" /> {subject.streakCount} days
          </p>
          <p className="text-sm text-text-secondary">Best: {subject.longestStreak} days</p>
        </div>
      </div>

      {/* Quick Mark */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">Mark Attendance</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium mb-1">Date</label>
            <input type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-surface-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Status</label>
            <select value={markStatus} onChange={(e) => setMarkStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-surface-2 text-sm">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button onClick={handleMark} disabled={marking}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
            {marking ? "Saving..." : "Mark"}
          </button>
        </div>
      </div>

      {/* Schedule */}
      {subject.schedules?.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3">Schedule</h3>
          <div className="space-y-2">
            {subject.schedules.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg">
                <span className="text-sm font-medium w-12">{DAYS[s.dayOfWeek]}</span>
                <Clock className="w-4 h-4 text-text-muted" />
                <span className="text-sm">{s.startTime} - {s.endTime}</span>
                {s.room && <><MapPin className="w-4 h-4 text-text-muted ml-2" /><span className="text-sm">{s.room}</span></>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">Recent Attendance</h3>
        {subject.attendanceRecords?.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center">No records yet</p>
        ) : (
          <div className="space-y-2">
            {subject.attendanceRecords?.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <CalIcon className="w-4 h-4 text-text-muted" />
                  <span className="text-sm">{new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <span className={clsx("px-2 py-0.5 rounded text-xs font-medium", STATUS_COLORS[r.status])}>
                    {r.status}
                  </span>
                </div>
                <button onClick={() => deleteRecord(r.id)} className="text-text-muted hover:text-danger p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
