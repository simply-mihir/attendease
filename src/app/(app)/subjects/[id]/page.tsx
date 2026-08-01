"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch, invalidate } from "@/hooks/useSWRFetch";
import { calculateAttendance } from "@/lib/attendance-calc";
import {
  ArrowLeft, Clock, MapPin, Flame, CheckCircle2, XCircle, Timer,
  Trash2, Calendar as CalIcon, AlertTriangle, Edit2, Save, Plus, Zap, Loader2, Bell, Circle,
  Mail, MessageSquare, Volume2
} from "lucide-react";
import clsx from "clsx";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const STATUS_COLORS: Record<string, string> = {
  present: "bg-green-500/10 text-green-400 border border-green-500/20",
  absent: "bg-red-500/10 text-red-400 border border-red-500/20",
  late: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  excused: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  cancelled: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  holiday: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
};

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  
  // Mark Attendance State
  const [marking, setMarking] = useState(false);
  const [markDate, setMarkDate] = useState(new Date().toISOString().slice(0, 10));
  const [markStatus, setMarkStatus] = useState("present");
  
  // Modals State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Edit Subject State
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [editSubjectData, setEditSubjectData] = useState({ name: "", code: "", instructorName: "", minAttendancePct: 75 });
  const [savingSubject, setSavingSubject] = useState(false);

  // Edit Attendance State
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editRecordDate, setEditRecordDate] = useState("");
  const [editRecordStatus, setEditRecordStatus] = useState("");
  const [savingRecord, setSavingRecord] = useState(false);

  // Schedule State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"add" | "edit">("add");
  const [scheduleForm, setScheduleForm] = useState({ id: "", dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "", building: "" });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Extra Class State
  const [showExtraClassModal, setShowExtraClassModal] = useState(false);
  const [extraClassForm, setExtraClassForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: "10:00",
    endTime: "11:00",
    room: "",
    topic: "",
    status: "present",
  });
  const [savingExtraClass, setSavingExtraClass] = useState(false);
  const [addReminderForExtraClass, setAddReminderForExtraClass] = useState(true);

  // Subject Reminders State
  const { data: subjectRemindersData } = useSWRFetch<any>(`/reminders?subjectId=${id}`);
  const subjectReminders = subjectRemindersData?.reminders || [];

  const [showSubjectReminderModal, setShowSubjectReminderModal] = useState(false);
  const [subjectReminderForm, setSubjectReminderForm] = useState({
    title: "",
    category: "assignment",
    dueDate: new Date().toISOString().slice(0, 10),
    dueTime: "12:00",
    priority: "medium",
    description: "",
    notifyPush: true,
    notifyAlarm: true,
    notifyEmail: false,
    notifyTelegram: false,
  });
  const [savingSubjectReminder, setSavingSubjectReminder] = useState(false);

  const { data, isLoading: loading } = useSWRFetch<any>(`/subjects/${id}`);
  const subject = data?.subject;

  if (loading || !subject) {
    return <FuturisticLoader variant="section" title="Loading subject" icon="📚" />;
  }

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
      await invalidate(`/subjects/${id}`);
    } catch (err) { console.error(err); }
    finally { setMarking(false); }
  }

  async function deleteRecord(recordId: string) {
    if (!confirm("Delete this record?")) return;
    await apiFetch(`/attendance/${recordId}`, { method: "DELETE" });
    await invalidate(`/subjects/${id}`);
  }

  async function handleDeleteSubject() {
    try {
      await apiFetch(`/subjects/${id}`, { method: "DELETE" });
      router.push("/subjects");
    } catch (err) {
      console.error(err);
    }
  }

  function openEditSubjectModal() {
    setEditSubjectData({
      name: subject.name,
      code: subject.code || "",
      instructorName: subject.instructorName || "",
      minAttendancePct: subject.minAttendancePct
    });
    setShowEditSubjectModal(true);
  }

  async function handleSaveSubject() {
    setSavingSubject(true);
    try {
      await apiFetch(`/subjects/${id}`, {
        method: "PUT",
        body: JSON.stringify(editSubjectData)
      });
      setShowEditSubjectModal(false);
      await invalidate(`/subjects/${id}`);
    } catch (err) { console.error(err); }
    finally { setSavingSubject(false); }
  }

  function openEditAttendanceModal(record: any) {
    setEditingRecord(record);
    setEditRecordDate(new Date(record.date).toISOString().slice(0, 10));
    setEditRecordStatus(record.status);
  }

  async function handleSaveAttendance() {
    if (!editingRecord) return;
    setSavingRecord(true);
    try {
      await apiFetch(`/attendance/${editingRecord.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: editRecordStatus, date: editRecordDate })
      });
      setEditingRecord(null);
      await invalidate(`/subjects/${id}`);
    } catch (err) { console.error(err); }
    finally { setSavingRecord(false); }
  }

  function openAddScheduleModal() {
    setScheduleMode("add");
    setScheduleForm({ id: "", dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "", building: "" });
    setShowScheduleModal(true);
  }

  function openEditScheduleModal(s: any) {
    setScheduleMode("edit");
    setScheduleForm({ id: s.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, room: s.room || "", building: s.building || "" });
    setShowScheduleModal(true);
  }

  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSavingSchedule(true);
    try {
      if (scheduleMode === "add") {
        await apiFetch("/schedules", {
          method: "POST",
          body: JSON.stringify({ subjectId: id, dayOfWeek: Number(scheduleForm.dayOfWeek), startTime: scheduleForm.startTime, endTime: scheduleForm.endTime, room: scheduleForm.room, building: scheduleForm.building })
        });
      } else {
        await apiFetch(`/schedules/${scheduleForm.id}`, {
          method: "PUT",
          body: JSON.stringify({ dayOfWeek: Number(scheduleForm.dayOfWeek), startTime: scheduleForm.startTime, endTime: scheduleForm.endTime, room: scheduleForm.room, building: scheduleForm.building })
        });
      }
      setShowScheduleModal(false);
      await invalidate(`/subjects/${id}`);
    } catch (err) { console.error(err); }
    finally { setSavingSchedule(false); }
  }

  async function handleDeleteSchedule(scheduleId: string) {
    if (!confirm("Delete this schedule?")) return;
    try {
      await apiFetch(`/schedules/${scheduleId}`, { method: "DELETE" });
      await invalidate(`/subjects/${id}`);
    } catch (err) { console.error(err); }
  }

  function openAddExtraClassModal() {
    setExtraClassForm({
      date: new Date().toISOString().slice(0, 10),
      startTime: "10:00",
      endTime: "11:00",
      room: "",
      topic: "",
      status: "present",
    });
    setShowExtraClassModal(true);
  }

  async function handleSaveExtraClass(e: React.FormEvent) {
    e.preventDefault();
    setSavingExtraClass(true);
    try {
      const selectedDate = new Date(extraClassForm.date);
      const dayOfWeek = selectedDate.getDay();

      const roomStr = extraClassForm.room
        ? `${extraClassForm.room} (Extra Class)`
        : "Extra Class";

      const scheduleRes = await apiFetch("/schedules", {
        method: "POST",
        body: JSON.stringify({
          subjectId: id,
          dayOfWeek,
          startTime: extraClassForm.startTime,
          endTime: extraClassForm.endTime,
          room: roomStr,
          building: extraClassForm.topic || "Extra Class",
        }),
      });

      await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({
          subjectId: id,
          date: extraClassForm.date,
          status: extraClassForm.status,
          scheduleId: scheduleRes?.schedule?.id || null,
          source: "extra_class",
          notes: `Extra Class${extraClassForm.topic ? `: ${extraClassForm.topic}` : ""}${extraClassForm.room ? ` (${extraClassForm.room})` : ""}`,
        }),
      });

      if (addReminderForExtraClass) {
        await apiFetch("/reminders", {
          method: "POST",
          body: JSON.stringify({
            subjectId: id,
            title: `Extra Class: ${subject.name}${extraClassForm.topic ? ` - ${extraClassForm.topic}` : ""}`,
            category: "extra_class",
            dueDate: extraClassForm.date,
            dueTime: extraClassForm.startTime,
            priority: "high",
            description: extraClassForm.room ? `Room: ${extraClassForm.room}` : undefined,
          }),
        });
        await invalidate(`/reminders?subjectId=${id}`);
        await invalidate("/reminders");
      }

      setShowExtraClassModal(false);
      await invalidate(`/subjects/${id}`);
      await invalidate("/dashboard");
    } catch (err) {
      console.error("Extra class save error:", err);
    } finally {
      setSavingExtraClass(false);
    }
  }

  async function handleSaveSubjectReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectReminderForm.title.trim()) return;
    setSavingSubjectReminder(true);
    try {
      await apiFetch("/reminders", {
        method: "POST",
        body: JSON.stringify({
          subjectId: id,
          title: subjectReminderForm.title,
          category: subjectReminderForm.category,
          dueDate: subjectReminderForm.dueDate,
          dueTime: subjectReminderForm.dueTime,
          priority: subjectReminderForm.priority,
          description: subjectReminderForm.description,
          notifyPush: subjectReminderForm.notifyPush,
          notifyAlarm: subjectReminderForm.notifyAlarm,
          notifyEmail: subjectReminderForm.notifyEmail,
          notifyTelegram: subjectReminderForm.notifyTelegram,
        }),
      });
      setShowSubjectReminderModal(false);
      setSubjectReminderForm({
        title: "",
        category: "assignment",
        dueDate: new Date().toISOString().slice(0, 10),
        dueTime: "12:00",
        priority: "medium",
        description: "",
        notifyPush: true,
        notifyAlarm: true,
        notifyEmail: false,
        notifyTelegram: false,
      });
      await invalidate(`/reminders?subjectId=${id}`);
      await invalidate("/reminders");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSubjectReminder(false);
    }
  }

  async function toggleSubjectReminder(reminderId: string, currentStatus: boolean) {
    try {
      await apiFetch(`/reminders/${reminderId}`, {
        method: "PUT",
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });
      await invalidate(`/reminders?subjectId=${id}`);
      await invalidate("/reminders");
    } catch (err) { console.error(err); }
  }

  async function deleteSubjectReminder(reminderId: string) {
    if (!confirm("Delete reminder?")) return;
    try {
      await apiFetch(`/reminders/${reminderId}`, { method: "DELETE" });
      await invalidate(`/reminders?subjectId=${id}`);
      await invalidate("/reminders");
    } catch (err) { console.error(err); }
  }

  // Progress ring SVG
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (stats.currentPercentage / 100) * circumference;
  const ringGradientId = `ring-gradient-${id}`;
  const ringColor = stats.statusColor === "green" ? ["#10b981", "#059669"] : stats.statusColor === "yellow" ? ["#f59e0b", "#d97706"] : ["#f43f5e", "#e11d48"];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/subjects" className="flex items-center gap-2 text-text-secondary text-sm hover:text-text transition">
          <ArrowLeft className="w-4 h-4" /> Back to Subjects
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={openEditSubjectModal}
            className="btn-ghost px-3 py-1.5 rounded-full text-xs text-text hover:bg-white/10 flex items-center gap-1.5 transition"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Subject
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-ghost px-3 py-1.5 rounded-full text-xs text-red-400 hover:bg-red-500/10 border-red-500/20 flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-4 h-16 rounded-full animate-pulse-glow" style={{ backgroundColor: subject.colorHex }} />
            <div>
              <h1 className="text-2xl font-bold text-text">{subject.name}</h1>
              <p className="text-text-secondary text-sm">{subject.code} {subject.instructorName && `· ${subject.instructorName}`}</p>
              {subject.semester && <p className="text-xs text-text-muted mt-1">{subject.semester.name}</p>}
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
        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="text-center p-3 bg-white/5 rounded-2xl border-2 border-transparent">
            <p className="text-2xl font-bold text-text">{subject.totalClassesHeld}</p>
            <p className="text-xs text-text-muted">Conducted</p>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-2xl border-2 border-green-500/20">
            <p className="text-2xl font-bold text-green-400">{subject.totalPresent}</p>
            <p className="text-xs text-text-muted">Present</p>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-2xl border-2 border-red-500/20">
            <p className="text-2xl font-bold text-red-400">{subject.totalAbsent}</p>
            <p className="text-xs text-text-muted">Absent</p>
          </div>
          <div className="text-center p-3 bg-yellow-500/10 rounded-2xl border-2 border-yellow-500/20">
            <p className="text-2xl font-bold text-yellow-400">{subject.totalLate}</p>
            <p className="text-xs text-text-muted">Late</p>
          </div>
          <div className="text-center p-3 bg-slate-500/10 rounded-2xl border-2 border-slate-500/20">
            <p className="text-2xl font-bold text-slate-400">{subject.totalCancelled || 0}</p>
            <p className="text-xs text-text-muted">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Bunk Calculator + Streak */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={clsx("glass-glow p-5",
          stats.statusColor === "red" ? "border-red-500" : "border-green-500"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center border-2 border-border-heavy",
              stats.isInDanger ? "bg-red-500" : "bg-green-500"
            )}>
              {stats.isInDanger ? <XCircle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
            </div>
            <h3 className="font-semibold text-text">
              {stats.isInDanger ? "Recovery Plan" : "Bunk Calculator"}
            </h3>
          </div>
          <p className={clsx("text-3xl font-black mb-1", stats.isInDanger ? "text-red-400" : "text-green-400")}>
            {stats.isInDanger ? stats.mustAttendCount : stats.canSkipCount}
          </p>
          <p className="text-sm text-text-secondary">
            {stats.isInDanger
              ? `consecutive classes needed to reach ${subject.minAttendancePct}%`
              : `classes you can still skip safely`}
          </p>
          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-text-muted leading-relaxed">
            {stats.reasoning}
          </div>
        </div>
        <div className="glass-glow p-5 border-yellow-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500 flex items-center justify-center border-2 border-border-heavy">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-text">Streak</h3>
          </div>
          <p className="text-3xl font-black text-yellow-500 flex items-center gap-2">
            <Flame className="w-8 h-8" /> {subject.streakCount} days
          </p>
          <p className="text-sm text-text-secondary">Best: {subject.longestStreak} days</p>
        </div>
      </div>

      {/* Quick Mark */}
      <div className="glass p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center border-2 border-border-heavy">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-text">Mark Attendance</h3>
        </div>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">Date</label>
            <input type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)}
              className="input-glass px-4 py-3" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">Status</label>
            <select value={markStatus} onChange={(e) => setMarkStatus(e.target.value)}
              className="input-glass px-4 py-3 appearance-none">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
              <option value="cancelled">Cancelled / Class Off</option>
            </select>
          </div>
          <button onClick={handleMark} disabled={marking}
            className="btn-gradient px-6 py-3 ml-auto">
            {marking ? "Saving..." : "Mark Attendance"}
          </button>
        </div>
      </div>

      {/* Schedule */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center border-2 border-border-heavy">
              <Clock className="w-5 h-5 text-border-heavy" />
            </div>
            <h3 className="font-semibold text-text">Schedule</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openAddExtraClassModal} className="btn-gradient-cyan px-3 py-1.5 rounded-full text-xs text-white flex items-center gap-1.5 transition font-semibold">
              <Zap className="w-3.5 h-3.5" /> Extra Class
            </button>
            <button onClick={openAddScheduleModal} className="btn-ghost px-3 py-1.5 rounded-full text-xs text-text hover:bg-white/10 flex items-center gap-1.5 transition">
              <Plus className="w-3.5 h-3.5" /> Add Slot
            </button>
          </div>
        </div>
        {subject.schedules?.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center font-semibold">No schedule set</p>
        ) : (
          <div className="space-y-2">
            {subject.schedules?.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 border-2 border-border-heavy rounded-2xl hover:bg-white/10 transition">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-black w-12 text-primary">{DAYS[s.dayOfWeek]}</span>
                  <Clock className="w-4 h-4 text-text-muted" />
                  <span className="text-sm font-semibold text-text-secondary">{s.startTime} - {s.endTime}</span>
                  {s.room && <><MapPin className="w-4 h-4 text-text-muted ml-2" /><span className="text-sm font-semibold text-text-secondary">{s.room} {s.building && `(${s.building})`}</span></>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditScheduleModal(s)} className="btn-ghost p-2 text-text-muted hover:text-primary transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteSchedule(s.id)} className="btn-ghost p-2 text-text-muted hover:text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject Reminders & Tasks */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center border-2 border-amber-500/30">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-text">Subject Reminders & Tasks</h3>
              <p className="text-xs text-text-muted">Assignments, tests & deadlines for {subject.name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowSubjectReminderModal(true)}
            className="btn-ghost px-3.5 py-1.5 rounded-full text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 transition font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Reminder
          </button>
        </div>

        {subjectReminders.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center font-semibold">No reminders for this subject yet</p>
        ) : (
          <div className="space-y-2">
            {subjectReminders.map((rem: any) => (
              <div
                key={rem.id}
                className={clsx(
                  "flex items-center justify-between p-3 bg-white/5 border-2 border-border-heavy rounded-2xl transition hover:bg-white/10",
                  rem.isCompleted && "opacity-50 line-through"
                )}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={() => toggleSubjectReminder(rem.id, rem.isCompleted)} className="text-text-muted hover:text-green-400 transition">
                    {rem.isCompleted ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <span className="text-sm font-bold text-text">{rem.title}</span>
                  <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {new Date(rem.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/5 text-text-secondary">
                    {rem.category.replace("_", " ")}
                  </span>
                </div>
                <button onClick={() => deleteSubjectReminder(rem.id)} className="p-1 text-text-muted hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance History */}
      <div className="glass p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-pink flex items-center justify-center border-2 border-border-heavy">
            <CalIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-text">Recent Attendance</h3>
        </div>
        {subject.attendanceRecords?.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center font-semibold">No records yet</p>
        ) : (
          <div className="space-y-2">
            {subject.attendanceRecords?.map((r: any) => {
              const isExtraClass = r.source === "extra_class" || r.notes?.includes("Extra Class");
              return (
                <div key={r.id} className="flex items-center justify-between p-3 bg-white/5 border-2 border-border-heavy rounded-2xl hover:bg-white/10 transition">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CalIcon className="w-4 h-4 text-text-muted" />
                    <span className="text-sm font-bold text-text-secondary">{new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                    <span className={clsx("px-3 py-1 rounded-full text-xs font-black capitalize", STATUS_COLORS[r.status])}>
                      {r.status}
                    </span>
                    {isExtraClass && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Extra Class
                      </span>
                    )}
                    {r.notes && !isExtraClass && (
                      <span className="text-xs text-text-muted italic">({r.notes})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditAttendanceModal(r)} className="btn-ghost p-2 text-text-muted hover:text-primary transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteRecord(r.id)} className="btn-ghost p-2 text-text-muted hover:text-red-400 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Subject Modal */}
      {showEditSubjectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4">
            <h3 className="text-xl font-black text-text mb-4">Edit Subject</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Subject Name</label>
                <input type="text" value={editSubjectData.name} onChange={e => setEditSubjectData({...editSubjectData, name: e.target.value})} className="input-glass w-full py-2.5" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Course Code (Optional)</label>
                <input type="text" value={editSubjectData.code} onChange={e => setEditSubjectData({...editSubjectData, code: e.target.value})} className="input-glass w-full py-2.5" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Instructor (Optional)</label>
                <input type="text" value={editSubjectData.instructorName} onChange={e => setEditSubjectData({...editSubjectData, instructorName: e.target.value})} className="input-glass w-full py-2.5" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Min. Attendance %</label>
                <input type="number" min="0" max="100" value={editSubjectData.minAttendancePct} onChange={e => setEditSubjectData({...editSubjectData, minAttendancePct: parseInt(e.target.value) || 0})} className="input-glass w-full py-2.5" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowEditSubjectModal(false)} className="btn-ghost flex-1 py-3">Cancel</button>
              <button onClick={handleSaveSubject} disabled={savingSubject} className="btn-gradient flex-1 py-3">{savingSubject ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="glass-strong rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-4">
            <h3 className="text-xl font-black text-text mb-4">Edit Record</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Date</label>
                <input type="date" value={editRecordDate} onChange={e => setEditRecordDate(e.target.value)} className="input-glass w-full py-2.5" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Status</label>
                <select value={editRecordStatus} onChange={e => setEditRecordStatus(e.target.value)} className="input-glass w-full py-2.5 appearance-none">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                  <option value="cancelled">Cancelled / Class Off</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setEditingRecord(null)} className="btn-ghost flex-1 py-3">Cancel</button>
              <button onClick={handleSaveAttendance} disabled={savingRecord} className="btn-gradient flex-1 py-3">{savingRecord ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleSaveSchedule} className="glass-strong rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-4">
            <h3 className="text-xl font-black text-text mb-4">{scheduleMode === "add" ? "Add Schedule" : "Edit Schedule"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Day of Week</label>
                <select value={scheduleForm.dayOfWeek} onChange={e => setScheduleForm({ ...scheduleForm, dayOfWeek: Number(e.target.value) })} className="input-glass w-full py-2.5 appearance-none">
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Start Time</label>
                  <input type="time" value={scheduleForm.startTime} onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} required className="input-glass w-full py-2.5" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">End Time</label>
                  <input type="time" value={scheduleForm.endTime} onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} required className="input-glass w-full py-2.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Room (Optional)</label>
                  <input type="text" value={scheduleForm.room} onChange={e => setScheduleForm({ ...scheduleForm, room: e.target.value })} className="input-glass w-full py-2.5" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Building (Optional)</label>
                  <input type="text" value={scheduleForm.building} onChange={e => setScheduleForm({ ...scheduleForm, building: e.target.value })} className="input-glass w-full py-2.5" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowScheduleModal(false)} className="btn-ghost flex-1 py-3">Cancel</button>
              <button type="submit" disabled={savingSchedule} className="btn-gradient flex-1 py-3">{savingSchedule ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Extra Class Modal */}
      {showExtraClassModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSaveExtraClass} className="glass-strong rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4 border border-cyan-500/30">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-text">Schedule Extra Class</h3>
                <p className="text-xs text-text-muted">Add a one-off or makeup lecture for {subject.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Date</label>
                <input type="date" value={extraClassForm.date} onChange={e => setExtraClassForm({ ...extraClassForm, date: e.target.value })} required className="input-glass w-full py-2.5" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Start Time</label>
                  <input type="time" value={extraClassForm.startTime} onChange={e => setExtraClassForm({ ...extraClassForm, startTime: e.target.value })} required className="input-glass w-full py-2.5 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">End Time</label>
                  <input type="time" value={extraClassForm.endTime} onChange={e => setExtraClassForm({ ...extraClassForm, endTime: e.target.value })} required className="input-glass w-full py-2.5 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Room / Venue (Optional)</label>
                <input type="text" value={extraClassForm.room} onChange={e => setExtraClassForm({ ...extraClassForm, room: e.target.value })} placeholder="e.g. Hall 301 / Lab B" className="input-glass w-full py-2.5" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Topic / Notes (Optional)</label>
                <input type="text" value={extraClassForm.topic} onChange={e => setExtraClassForm({ ...extraClassForm, topic: e.target.value })} placeholder="e.g. Revision / Special Lecture" className="input-glass w-full py-2.5" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Attendance Status</label>
                <select value={extraClassForm.status} onChange={e => setExtraClassForm({ ...extraClassForm, status: e.target.value })} className="input-glass w-full py-2.5 appearance-none">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                  <option value="cancelled">Cancelled / Class Off</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-text cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addReminderForExtraClass}
                  onChange={e => setAddReminderForExtraClass(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                Also create a reminder for this extra class
              </label>
            </div>

            <div className="flex gap-3 pt-3">
              <button type="button" onClick={() => setShowExtraClassModal(false)} className="btn-ghost flex-1 py-3">Cancel</button>
              <button type="submit" disabled={savingExtraClass} className="btn-gradient-cyan flex-1 py-3 font-semibold flex items-center justify-center gap-2">
                {savingExtraClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Save Extra Class
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Subject Reminder Modal */}
      {showSubjectReminderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSaveSubjectReminder} className="glass-strong rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4 border border-amber-500/30">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Bell className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-black text-text">New Subject Reminder</h3>
                <p className="text-xs text-text-muted">Set assignment, exam or task deadline for {subject.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Title *</label>
                <input type="text" value={subjectReminderForm.title} onChange={e => setSubjectReminderForm({ ...subjectReminderForm, title: e.target.value })} placeholder="e.g. Lab Report Submission" required className="input-glass w-full py-2.5" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Category</label>
                  <select value={subjectReminderForm.category} onChange={e => setSubjectReminderForm({ ...subjectReminderForm, category: e.target.value })} className="input-glass w-full py-2.5 appearance-none">
                    <option value="assignment">Assignment</option>
                    <option value="extra_class">Extra Class</option>
                    <option value="exam">Exam / Test</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Priority</label>
                  <select value={subjectReminderForm.priority} onChange={e => setSubjectReminderForm({ ...subjectReminderForm, priority: e.target.value })} className="input-glass w-full py-2.5 appearance-none">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Due Date *</label>
                  <input type="date" value={subjectReminderForm.dueDate} onChange={e => setSubjectReminderForm({ ...subjectReminderForm, dueDate: e.target.value })} required className="input-glass w-full py-2.5" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Due Time</label>
                  <input type="time" value={subjectReminderForm.dueTime} onChange={e => setSubjectReminderForm({ ...subjectReminderForm, dueTime: e.target.value })} className="input-glass w-full py-2.5 font-mono" />
                </div>
              </div>

              {/* Notification Channels Opt-In */}
              <div className="p-3 bg-white/5 border border-amber-500/20 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-amber-300">
                  Notify Me Via (Choose Channels):
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-surface-2 hover:bg-surface-3 transition">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyPush}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyPush: e.target.checked })}
                      className="rounded accent-amber-500"
                    />
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Browser Push</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-surface-2 hover:bg-surface-3 transition">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyAlarm}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyAlarm: e.target.checked })}
                      className="rounded accent-amber-500"
                    />
                    <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Alarm Sound</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-surface-2 hover:bg-surface-3 transition">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyEmail}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyEmail: e.target.checked })}
                      className="rounded accent-amber-500"
                    />
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Email Alert</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-surface-2 hover:bg-surface-3 transition">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyTelegram}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyTelegram: e.target.checked })}
                      className="rounded accent-amber-500"
                    />
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Telegram</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Description (Optional)</label>
                <textarea value={subjectReminderForm.description} onChange={e => setSubjectReminderForm({ ...subjectReminderForm, description: e.target.value })} placeholder="Details, questions to solve, submission portal..." rows={2} className="input-glass w-full py-2 text-xs rounded-2xl" />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button type="button" onClick={() => setShowSubjectReminderModal(false)} className="btn-ghost flex-1 py-3">Cancel</button>
              <button type="submit" disabled={savingSubjectReminder} className="btn-gradient flex-1 py-3 font-semibold flex items-center justify-center gap-2">
                {savingSubjectReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />} Save Reminder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4 border border-red-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center border-2 border-border-heavy">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-text">Delete {subject.name}?</h3>
                <p className="text-xs font-semibold text-text-muted">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-text-secondary">
              This will permanently delete <strong className="text-text">{subject.name}</strong>, its schedules, and all attendance logs.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="btn-ghost flex-1 py-3">
                Cancel
              </button>
              <button onClick={handleDeleteSubject} className="btn-gradient flex-1 py-3 bg-red-500 hover:bg-red-600">
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
