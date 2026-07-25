"use client";
import { useEffect, useState, useCallback } from "react";
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
  present: "bg-green-500/10 text-green-400",
  absent: "bg-red-500/10 text-red-400",
  late: "bg-yellow-500/10 text-yellow-400",
  excused: "bg-purple-500/10 text-purple-400",
  cancelled: "bg-white/10 text-gray-500",
  holiday: "bg-white/10 text-gray-500",
};

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [subject, setSubject] = useState<any>(null);
  const [marking, setMarking] = useState(false);
  const [markDate, setMarkDate] = useState(new Date().toISOString().slice(0, 10));
  const [markStatus, setMarkStatus] = useState("present");

  const load = useCallback(async () => {
    const data = await apiFetch(`/subjects/${id}`);
    setSubject(data.subject);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!subject) return <div className="text-center py-16 text-gray-500">Loading...</div>;

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

  const ringGradientId = "ring-gradient";
  const ringColor = stats.statusColor === "green" ? ["#22c55e", "#10b981"] : stats.statusColor === "yellow" ? ["#f59e0b", "#eab308"] : ["#ef4444", "#f43f5e"];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Link href="/subjects" className="flex items-center gap-2 text-gray-400 text-sm hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Subjects
      </Link>

      {/* Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-4 h-16 rounded-full animate-pulse-glow" style={{ backgroundColor: subject.colorHex }} />
            <div>
              <h1 className="text-2xl font-bold text-white">{subject.name}</h1>
              <p className="text-gray-400 text-sm">{subject.code} {subject.instructorName && `· ${subject.instructorName}`}</p>
              {subject.semester && <p className="text-xs text-gray-500 mt-1">{subject.semester.name}</p>}
            </div>
          </div>
          {/* Progress ring */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id={ringGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={ringColor[0]} />
                  <stop offset="100%" stopColor={ringColor[1]} />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r={radius} fill="none"
                stroke={`url(#${ringGradientId})`}
                strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                className="progress-ring transition-all duration-700" style={{ filter: `drop-shadow(0 0 6px ${ringColor[0]}40)` }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={clsx("text-lg font-bold", stats.statusColor === "green" ? "text-green-400" : stats.statusColor === "yellow" ? "text-yellow-400" : "text-red-400")}>
                {stats.currentPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <p className="text-2xl font-bold text-white">{subject.totalClassesHeld}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-xl border border-green-500/20">
            <p className="text-2xl font-bold text-green-400">{subject.totalPresent}</p>
            <p className="text-xs text-gray-500">Present</p>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <p className="text-2xl font-bold text-red-400">{subject.totalAbsent}</p>
            <p className="text-xs text-gray-500">Absent</p>
          </div>
          <div className="text-center p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <p className="text-2xl font-bold text-yellow-400">{subject.totalLate}</p>
            <p className="text-xs text-gray-500">Late</p>
          </div>
        </div>
      </div>

      {/* Bunk Calculator + Streak */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={clsx("glass-glow rounded-2xl p-5",
          stats.statusColor === "red" ? "border-red-500/30" : "border-green-500/30"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center",
              stats.isInDanger ? "bg-gradient-to-br from-red-500 to-rose-500" : "bg-gradient-to-br from-green-500 to-emerald-500"
            )}>
              {stats.isInDanger ? <XCircle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
            </div>
            <h3 className="font-semibold text-white">
              {stats.isInDanger ? "Recovery Plan" : "Bunk Calculator"}
            </h3>
          </div>
          <p className={clsx("text-3xl font-bold mb-1", stats.isInDanger ? "text-red-400" : "text-green-400")}>
            {stats.isInDanger ? stats.mustAttendCount : stats.canSkipCount}
          </p>
          <p className="text-sm text-gray-400">
            {stats.isInDanger
              ? `consecutive classes needed to reach ${subject.minAttendancePct}%`
              : `classes you can still skip safely`}
          </p>
        </div>
        <div className="glass-glow rounded-2xl p-5 border-yellow-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-white">Streak</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-400 flex items-center gap-2">
            <Flame className="w-8 h-8" /> {subject.streakCount} days
          </p>
          <p className="text-sm text-gray-400">Best: {subject.longestStreak} days</p>
        </div>
      </div>

      {/* Quick Mark */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-white">Mark Attendance</h3>
        </div>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
            <input type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)}
              className="input-glass px-3 py-2 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
            <select value={markStatus} onChange={(e) => setMarkStatus(e.target.value)}
              className="input-glass px-3 py-2 rounded-xl text-sm">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button onClick={handleMark} disabled={marking}
            className="btn-gradient px-6 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
            {marking ? "Saving..." : "Mark"}
          </button>
        </div>
      </div>

      {/* Schedule */}
      {subject.schedules?.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-white">Schedule</h3>
          </div>
          <div className="space-y-2">
            {subject.schedules.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <span className="text-sm font-medium w-12 text-purple-400">{DAYS[s.dayOfWeek]}</span>
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-300">{s.startTime} - {s.endTime}</span>
                {s.room && <><MapPin className="w-4 h-4 text-gray-500 ml-2" /><span className="text-sm text-gray-300">{s.room}</span></>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <CalIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-white">Recent Attendance</h3>
        </div>
        {subject.attendanceRecords?.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No records yet</p>
        ) : (
          <div className="space-y-2">
            {subject.attendanceRecords?.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
                <div className="flex items-center gap-3">
                  <CalIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-300">{new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <span className={clsx("px-2 py-0.5 rounded-lg text-xs font-medium", STATUS_COLORS[r.status])}>
                    {r.status}
                  </span>
                </div>
                <button onClick={() => deleteRecord(r.id)} className="text-gray-500 hover:text-red-400 p-1 transition">
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
