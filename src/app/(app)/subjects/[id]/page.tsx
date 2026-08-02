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
  Mail, MessageSquare, Volume2, BookOpen
} from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const STATUS_COLORS: Record<string, string> = {
  present: "bg-teal-50 text-teal-700 border border-teal-200/60 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20",
  absent: "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  late: "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  excused: "bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
  cancelled: "bg-slate-100 text-slate-700 border border-slate-200/60 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  holiday: "bg-slate-100 text-slate-700 border border-slate-200/60 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
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
    return <FuturisticLoader variant="section" title="Loading subject" Icon={BookOpen} />;
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
    <PageTransition direction="right" staggerChildren={false} className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Controls */}
      <div className="flex items-center justify-between" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Subjects
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={openEditSubjectModal}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-gray-200/60 shadow-sm text-gray-700 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Subject
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Header Banner Card */}
      <div
        className="rounded-3xl p-6 sm:p-7 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl"
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-3.5 h-16 rounded-full shadow-md shrink-0" style={{ backgroundColor: subject.colorHex }} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{subject.name}</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                {subject.code || "No code"} {subject.instructorName && `· ${subject.instructorName}`}
              </p>
              {subject.semester && (
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">
                  {subject.semester.name}
                </span>
              )}
            </div>
          </div>
          {/* Progress ring */}
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id={ringGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={ringColor[0]} />
                  <stop offset="100%" stopColor={ringColor[1]} />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" className="text-gray-100 dark:text-white/[0.08]" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={`url(#${ringGradientId})`}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="progress-ring transition-all duration-700"
                style={{ filter: `drop-shadow(0 0 6px ${ringColor[0]}40)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={clsx("text-lg font-black", stats.statusColor === "green" ? "text-teal-600 dark:text-teal-400" : stats.statusColor === "yellow" ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400")}>
                {stats.currentPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="text-center p-3.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.08] rounded-2xl">
            <p className="text-2xl font-black text-gray-900 dark:text-white">{subject.totalClassesHeld}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Conducted</p>
          </div>
          <div className="text-center p-3.5 bg-teal-50 border border-teal-200/60 dark:bg-teal-500/10 dark:border-teal-500/20 rounded-2xl">
            <p className="text-2xl font-black text-teal-700 dark:text-teal-400">{subject.totalPresent}</p>
            <p className="text-xs font-semibold text-teal-600 dark:text-teal-400/80 mt-0.5">Present</p>
          </div>
          <div className="text-center p-3.5 bg-rose-50 border border-rose-200/60 dark:bg-rose-500/10 dark:border-rose-500/20 rounded-2xl">
            <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{subject.totalAbsent}</p>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400/80 mt-0.5">Absent</p>
          </div>
          <div className="text-center p-3.5 bg-amber-50 border border-amber-200/60 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-2xl">
            <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{subject.totalLate}</p>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400/80 mt-0.5">Late</p>
          </div>
          <div className="col-span-2 sm:col-span-1 text-center p-3.5 bg-slate-50 border border-slate-200/60 dark:bg-slate-500/10 dark:border-slate-500/20 rounded-2xl">
            <p className="text-2xl font-black text-slate-700 dark:text-slate-400">{subject.totalCancelled || 0}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400/80 mt-0.5">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Bunk Calculator + Streak */}
      <div className="grid md:grid-cols-2 gap-4" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
        <div
          className={clsx(
            "rounded-3xl p-6 bg-white border shadow-sm dark:bg-white/[0.04] dark:backdrop-blur-xl transition-all",
            stats.isInDanger
              ? "border-rose-200 dark:border-rose-500/30"
              : "border-teal-200 dark:border-teal-500/30"
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={clsx(
                "w-10 h-10 rounded-2xl flex items-center justify-center shadow-md",
                stats.isInDanger
                  ? "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/20"
                  : "bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-teal-500/20"
              )}
            >
              {stats.isInDanger ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                {stats.isInDanger ? "Recovery Plan" : "Bunk Calculator"}
              </h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Target: {subject.minAttendancePct}%</p>
            </div>
          </div>
          <p className={clsx("text-4xl font-black mb-1", stats.isInDanger ? "text-rose-600 dark:text-rose-400" : "text-teal-600 dark:text-teal-400")}>
            {stats.isInDanger ? stats.mustAttendCount : stats.canSkipCount}
          </p>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            {stats.isInDanger
              ? `consecutive classes needed to reach ${subject.minAttendancePct}%`
              : `classes you can safely skip while staying above ${subject.minAttendancePct}%`}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
            {stats.reasoning}
          </div>
        </div>

        <div className="rounded-3xl p-6 bg-white border border-amber-200/60 shadow-sm dark:bg-white/[0.04] dark:border-amber-500/20 dark:backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Streak Stats</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Consistent attendance momentum</p>
            </div>
          </div>
          <p className="text-4xl font-black text-amber-500 flex items-center gap-2 mb-1">
            <Flame className="w-8 h-8 text-amber-500" /> {subject.streakCount} days
          </p>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Best record: {subject.longestStreak} days</p>
        </div>
      </div>

      {/* Quick Mark Attendance */}
      <div
        className="rounded-3xl p-6 sm:p-7 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl"
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 150ms forwards" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Mark Attendance</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Quickly record your status for any class session</p>
          </div>
        </div>
        <div className="flex gap-4 items-end flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-[140px] w-full">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
            <input
              type="date"
              value={markDate}
              onChange={(e) => setMarkDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
            />
          </div>
          <div className="flex-1 min-w-[140px] w-full">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            <select
              value={markStatus}
              onChange={(e) => setMarkStatus(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
              <option value="cancelled">Cancelled / Class Off</option>
            </select>
          </div>
          <button
            onClick={handleMark}
            disabled={marking}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50 h-[42px] flex items-center justify-center shrink-0"
          >
            {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Attendance"}
          </button>
        </div>
      </div>

      {/* Schedule Section */}
      <div
        className="rounded-3xl p-6 sm:p-7 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl"
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 200ms forwards" }}
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Weekly Schedule</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Class timings and room venues</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openAddExtraClassModal}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" /> Extra Class
            </button>
            <button
              onClick={openAddScheduleModal}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-gray-200/60 text-gray-700 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Slot
            </button>
          </div>
        </div>
        {subject.schedules?.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm py-6 text-center font-medium">No weekly schedule set yet.</p>
        ) : (
          <div className="space-y-2.5">
            {subject.schedules?.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.08] rounded-2xl hover:border-purple-300 dark:hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">
                    {DAYS[s.dayOfWeek]}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{s.startTime} – {s.endTime}</span>
                  </div>
                  {s.room && (
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{s.room} {s.building && `(${s.building})`}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditScheduleModal(s)}
                    className="p-1.5 text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-white/5 cursor-pointer"
                    title="Edit slot"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(s.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-gray-500 dark:hover:text-rose-400 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                    title="Delete slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject Reminders & Tasks */}
      <div
        className="rounded-3xl p-6 sm:p-7 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl"
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 250ms forwards" }}
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Subject Reminders & Tasks</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Assignments, tests & deadlines for {subject.name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowSubjectReminderModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Reminder
          </button>
        </div>

        {subjectReminders.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm py-6 text-center font-medium">No reminders for this subject yet.</p>
        ) : (
          <div className="space-y-2.5">
            {subjectReminders.map((rem: any) => (
              <div
                key={rem.id}
                className={clsx(
                  "flex items-center justify-between p-3.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.08] rounded-2xl transition-all hover:border-amber-300 dark:hover:border-white/20",
                  rem.isCompleted && "opacity-50 line-through"
                )}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => toggleSubjectReminder(rem.id, rem.isCompleted)}
                    className="text-gray-400 hover:text-teal-600 dark:text-gray-500 dark:hover:text-teal-400 transition cursor-pointer"
                  >
                    {rem.isCompleted ? <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{rem.title}</span>
                  <span className="text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20 px-2 py-0.5 rounded-md font-semibold">
                    {new Date(rem.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400">
                    {rem.category.replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={() => deleteSubjectReminder(rem.id)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-gray-500 dark:hover:text-rose-400 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                  title="Delete reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance History */}
      <div
        className="rounded-3xl p-6 sm:p-7 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl"
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 300ms forwards" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
            <CalIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Recent Attendance Records</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Detailed historical record of past classes</p>
          </div>
        </div>
        {subject.attendanceRecords?.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm py-6 text-center font-medium">No records logged yet.</p>
        ) : (
          <div className="space-y-2.5">
            {subject.attendanceRecords?.map((r: any) => {
              const isExtraClass = r.source === "extra_class" || r.notes?.includes("Extra Class");
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.08] rounded-2xl hover:border-purple-300 dark:hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <CalIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-black capitalize", STATUS_COLORS[r.status])}>
                      {r.status}
                    </span>
                    {isExtraClass && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Extra Class
                      </span>
                    )}
                    {r.notes && !isExtraClass && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 italic">({r.notes})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditAttendanceModal(r)}
                      className="p-1.5 text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 transition rounded-lg hover:bg-purple-50 dark:hover:bg-white/5 cursor-pointer"
                      title="Edit record"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRecord(r.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-gray-500 dark:hover:text-rose-400 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                      title="Delete record"
                    >
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl animate-fade-in space-y-4 bg-white border border-gray-200 dark:bg-[#0f172a] dark:border-white/10">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Edit Subject</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Subject Name</label>
                <input
                  type="text"
                  value={editSubjectData.name}
                  onChange={e => setEditSubjectData({...editSubjectData, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Course Code (Optional)</label>
                <input
                  type="text"
                  value={editSubjectData.code}
                  onChange={e => setEditSubjectData({...editSubjectData, code: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Instructor (Optional)</label>
                <input
                  type="text"
                  value={editSubjectData.instructorName}
                  onChange={e => setEditSubjectData({...editSubjectData, instructorName: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Min. Attendance %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editSubjectData.minAttendancePct}
                  onChange={e => setEditSubjectData({...editSubjectData, minAttendancePct: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditSubjectModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSubject}
                disabled={savingSubject}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {savingSubject ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-4 bg-white border border-gray-200 dark:bg-[#0f172a] dark:border-white/10">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Edit Record</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                <input
                  type="date"
                  value={editRecordDate}
                  onChange={e => setEditRecordDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                <select
                  value={editRecordStatus}
                  onChange={e => setEditRecordStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                  <option value="cancelled">Cancelled / Class Off</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={savingRecord}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {savingRecord ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveSchedule}
            className="rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-4 bg-white border border-gray-200 dark:bg-[#0f172a] dark:border-white/10"
          >
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              {scheduleMode === "add" ? "Add Schedule" : "Edit Schedule"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Day of Week</label>
                <select
                  value={scheduleForm.dayOfWeek}
                  onChange={e => setScheduleForm({ ...scheduleForm, dayOfWeek: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                >
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Room (Optional)</label>
                  <input
                    type="text"
                    value={scheduleForm.room}
                    onChange={e => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Building (Optional)</label>
                  <input
                    type="text"
                    value={scheduleForm.building}
                    onChange={e => setScheduleForm({ ...scheduleForm, building: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSchedule}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {savingSchedule ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Extra Class Modal */}
      {showExtraClassModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveExtraClass}
            className="rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl animate-fade-in space-y-4 bg-white border border-gray-200 dark:bg-[#0f172a] dark:border-cyan-500/30"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0 text-white">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Schedule Extra Class</h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Add a one-off or makeup lecture for {subject.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                <input
                  type="date"
                  value={extraClassForm.date}
                  onChange={e => setExtraClassForm({ ...extraClassForm, date: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={extraClassForm.startTime}
                    onChange={e => setExtraClassForm({ ...extraClassForm, startTime: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={extraClassForm.endTime}
                    onChange={e => setExtraClassForm({ ...extraClassForm, endTime: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Room / Venue (Optional)</label>
                <input
                  type="text"
                  value={extraClassForm.room}
                  onChange={e => setExtraClassForm({ ...extraClassForm, room: e.target.value })}
                  placeholder="e.g. Hall 301 / Lab B"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Topic / Notes (Optional)</label>
                <input
                  type="text"
                  value={extraClassForm.topic}
                  onChange={e => setExtraClassForm({ ...extraClassForm, topic: e.target.value })}
                  placeholder="e.g. Revision / Special Lecture"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Attendance Status</label>
                <select
                  value={extraClassForm.status}
                  onChange={e => setExtraClassForm({ ...extraClassForm, status: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                  <option value="cancelled">Cancelled / Class Off</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addReminderForExtraClass}
                  onChange={e => setAddReminderForExtraClass(e.target.checked)}
                  className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
                />
                Also create a reminder for this extra class
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExtraClassModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingExtraClass}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                {savingExtraClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Save Extra Class
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Subject Reminder Modal */}
      {showSubjectReminderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveSubjectReminder}
            className="rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl animate-fade-in space-y-4 bg-white border border-gray-200 dark:bg-[#0f172a] dark:border-amber-500/30"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 text-white">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">New Subject Reminder</h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Set assignment, exam or task deadline for {subject.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={subjectReminderForm.title}
                  onChange={e => setSubjectReminderForm({ ...subjectReminderForm, title: e.target.value })}
                  placeholder="e.g. Lab Report Submission"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                  <select
                    value={subjectReminderForm.category}
                    onChange={e => setSubjectReminderForm({ ...subjectReminderForm, category: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="extra_class">Extra Class</option>
                    <option value="exam">Exam / Test</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
                  <select
                    value={subjectReminderForm.priority}
                    onChange={e => setSubjectReminderForm({ ...subjectReminderForm, priority: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Due Date *</label>
                  <input
                    type="date"
                    value={subjectReminderForm.dueDate}
                    onChange={e => setSubjectReminderForm({ ...subjectReminderForm, dueDate: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Due Time</label>
                  <input
                    type="time"
                    value={subjectReminderForm.dueTime}
                    onChange={e => setSubjectReminderForm({ ...subjectReminderForm, dueTime: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* Notification Channels */}
              <div className="p-3.5 bg-amber-50/50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-amber-800 dark:text-amber-300">
                  Notify Me Via:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyPush}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyPush: e.target.checked })}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span>Browser Push</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyAlarm}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyAlarm: e.target.checked })}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                    <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Alarm Sound</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyEmail}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyEmail: e.target.checked })}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    <span>Email Alert</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyTelegram}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyTelegram: e.target.checked })}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Telegram</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Description (Optional)</label>
                <textarea
                  value={subjectReminderForm.description}
                  onChange={e => setSubjectReminderForm({ ...subjectReminderForm, description: e.target.value })}
                  placeholder="Details, questions to solve, submission portal..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubjectReminderModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSubjectReminder}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                {savingSubjectReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />} Save Reminder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl animate-fade-in space-y-4 bg-white border border-gray-200 dark:bg-[#0f172a] dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Delete {subject.name}?</h3>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              This will permanently delete <strong className="text-gray-900 dark:text-white">{subject.name}</strong>, its schedules, and all attendance logs.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubject}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/20 hover:shadow-lg transition cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
