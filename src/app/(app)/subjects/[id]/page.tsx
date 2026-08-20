"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch, invalidate } from "@/hooks/useSWRFetch";
import { calculateAttendance } from "@/lib/attendance-calc";
import { getLocalDateStr } from "@/lib/local-date";
// slug-only URLs: the [id] param is now the slug (e.g. "dbms")
import { X, ArrowLeft, Clock, MapPin, Flame, CheckCircle2, XCircle, Timer, Ban,
  Trash2, Calendar as CalIcon, AlertTriangle, Edit2, Save, Plus, Zap, Loader2, Bell, Circle,
  Mail, MessageSquare, Volume2, BookOpen } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { FieldLoader } from "@/components/FieldLoader";

function SubjectSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-gray-200 dark:bg-[#141425] rounded-md" />
      </div>
      <div className="card-3d p-6 sm:p-7 relative overflow-hidden">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-3.5 h-16 rounded-full shadow-md bg-gray-200 dark:bg-white/5" />
            <div>
              <div className="h-8 w-48 bg-gray-200 dark:bg-white/5 rounded-lg mb-2" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-white/5 rounded-md" />
            </div>
          </div>
          <div className="relative w-24 h-24 shrink-0 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center">
            <FieldLoader size="lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-white/5 border-2 border-gray-200 dark:border-[#2a2a3d] rounded-2xl flex items-center justify-center">
               <FieldLoader size="md" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-10 w-full bg-gray-200 dark:bg-[#141425] rounded-xl" />
      <div className="h-64 card-3d flex items-center justify-center">
        <FieldLoader size="lg" />
      </div>
    </div>
  );
}

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const STATUS_COLORS: Record<string, string> = {
  present: "bg-[#06d6a0]/15 text-[#06d6a0] border border-[#06d6a0]/40",
  absent: "bg-[#ef476f]/15 text-[#ef476f] border border-[#ef476f]/40",
  late: "bg-[#ff6b35]/15 text-[#ff6b35] border border-[#ff6b35]/40",
  excused: "bg-[#7b2cbf]/15 text-[#7b2cbf] dark:text-[#c77dff] border border-[#7b2cbf]/40",
  cancelled: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#1f1f35] dark:text-slate-400 dark:border-[#2a2a3d]",
  holiday: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#1f1f35] dark:text-slate-400 dark:border-[#2a2a3d]",
};

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const id = params.id; // slug like "dbms" — API resolves by slug or id
  const router = useRouter();
  
  // Mark Attendance State
  const [marking, setMarking] = useState(false);
  const [markDate, setMarkDate] = useState(getLocalDateStr());
  const [markStatus, setMarkStatus] = useState("present");
  const [markScheduleId, setMarkScheduleId] = useState("");
  const [markSuccess, setMarkSuccess] = useState(false);
  
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
  const [extraClassMode, setExtraClassMode] = useState<"add" | "edit">("add");
  const [extraClassForm, setExtraClassForm] = useState({
    id: "",
    date: getLocalDateStr(),
    startTime: "10:00",
    endTime: "11:00",
    room: "",
    topic: "",
    weight: 1,
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
    dueDate: getLocalDateStr(),
    dueTime: "12:00",
    priority: "medium",
    description: "",
    notifyPush: true,
    notifyAlarm: true,
    notifyEmail: false,
    notifyTelegram: false,
  });
  const [savingSubjectReminder, setSavingSubjectReminder] = useState(false);

  const { data, isLoading: loading, error } = useSWRFetch<any>(`/subjects/${id}`);
  const subject = data?.subject;

  // Extra Classes
  const { data: extraClassesData } = useSWRFetch<any>(subject ? `/schedule-override?subjectId=${subject.id}` : null);
  const allExtraClasses = (extraClassesData?.overrides || []).filter((o: any) => o.type === "extra");
  const todayStrForUpcoming = getLocalDateStr();
  const upcomingExtraClasses = allExtraClasses.filter((cls: any) => new Date(cls.date).toISOString().slice(0, 10) >= todayStrForUpcoming);

  if (error || (!loading && !subject)) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#ef476f]/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[#ef476f]" />
        </div>
        <h2 className="text-xl font-bold">Could not load subject</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {error?.message || "Subject not found or you don’t have access."}
        </p>
        <button onClick={() => router.push("/subjects")} className="btn-3d-primary px-5 py-2 text-sm font-bold mt-2">
          Back to Subjects
        </button>
      </div>
    );
  }

  if (loading) {
    return <SubjectSkeleton />;
  }

  const stats = calculateAttendance({
    totalClasses: subject.totalClassesHeld,
    totalPresent: subject.totalPresent,
    totalLate: subject.totalLate,
    totalAbsent: subject.totalAbsent,
    totalExcused: subject.totalExcused,
    minRequiredPct: subject.minAttendancePct,
  });

  // Calculate available slots for markDate
  const availableSlots: { id: string; label: string; time: string }[] = [];
  if (subject) {
    const [y, m, d] = markDate.split("-").map(Number);
    if (y && m && d) {
      const localDate = new Date(y, m - 1, d);
      const localDayOfWeek = localDate.getDay();

      const regularForDay = subject.schedules?.filter((s: any) => s.dayOfWeek === localDayOfWeek) || [];
      regularForDay.forEach((s: any) => {
        availableSlots.push({ id: s.id, label: `Regular: ${s.startTime} - ${s.endTime}`, time: s.startTime });
      });

      const extraForDay = allExtraClasses.filter((cls: any) => new Date(cls.date).toISOString().slice(0, 10) === markDate);
      extraForDay.forEach((cls: any) => {
        availableSlots.push({ id: cls.id, label: `Extra: ${cls.originalTime} - ${cls.newTime}`, time: cls.originalTime });
      });

      availableSlots.sort((a, b) => a.time.localeCompare(b.time));
    }
  }

  async function handleMark() {
    if (availableSlots.length > 0 && !markScheduleId) {
      alert("Please select a specific slot to mark attendance for.");
      return;
    }

    setMarking(true);
    setMarkSuccess(false);
    try {
      const finalScheduleId = markScheduleId || undefined;
      await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({ 
          subjectId: id, 
          date: markDate, 
          status: markStatus,
          scheduleId: finalScheduleId
        }),
      });
      await invalidate(`/subjects/${id}`);
      setMarkSuccess(true);
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      setTimeout(() => setMarkSuccess(false), 1800);
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
    setExtraClassMode("add");
    setExtraClassForm({
      id: "",
      date: getLocalDateStr(),
      startTime: "10:00",
      endTime: "11:00",
      room: "",
      topic: "",
      weight: 1,
    });
    setShowExtraClassModal(true);
  }

  function openEditExtraClassModal(cls: any) {
    setExtraClassMode("edit");
    const roomMatch = cls.note?.match(/\((.*?)\)/);
    const topicMatch = cls.note?.match(/Extra Class(?::\s*(.*?))?(?:\s*\(.*\))?$/);
    
    setExtraClassForm({
      id: cls.id,
      date: new Date(cls.date).toISOString().slice(0, 10),
      startTime: cls.originalTime || "10:00",
      endTime: cls.newTime || "11:00",
      room: roomMatch ? roomMatch[1] : "",
      topic: topicMatch && topicMatch[1] ? topicMatch[1].trim() : "",
      weight: cls.weight || 1,
    });
    setShowExtraClassModal(true);
  }

  async function handleDeleteExtraClass(id: string) {
    if (!confirm("Delete this extra class?")) return;
    try {
      await apiFetch(`/schedule-override/${id}`, { method: "DELETE" });
      await invalidate(`/schedule-override?subjectId=${subject?.id || id}&future=true`);
    } catch (err) { console.error(err); }
  }

  async function handleSaveExtraClass(e: React.FormEvent) {
    e.preventDefault();
    setSavingExtraClass(true);
    try {
      const payload = {
        subjectId: id,
        date: extraClassForm.date,
        type: "extra",
        originalTime: extraClassForm.startTime,
        newTime: extraClassForm.endTime,
        note: `Extra Class${extraClassForm.topic ? `: ${extraClassForm.topic}` : ""}${extraClassForm.room ? ` (${extraClassForm.room})` : ""}`,
        weight: extraClassForm.weight,
      };

      if (extraClassMode === "add") {
        await apiFetch("/schedule-override", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/schedule-override/${extraClassForm.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

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
        dueDate: getLocalDateStr(),
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
  const ringColor = stats.statusColor === "green" ? ["#06d6a0", "#00f5d4"] : stats.statusColor === "yellow" ? ["#ff6b35", "#ffa62b"] : ["#ef476f", "#FF2D78"];

  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Controls */}
      <div className="flex items-center justify-between" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-2 text-sm font-bold text-text-muted hover:text-[#1a1a2e] dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Subjects
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={openEditSubjectModal}
            className="btn-3d-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Subject
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-3d-coral px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Header Banner Card */}
      <div
        className="card-3d p-6 sm:p-7"
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-3.5 h-16 rounded-full shadow-md shrink-0" style={{ backgroundColor: subject.colorHex || "#FF2D78" }} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">{subject.name}</h1>
              <p className="text-sm font-semibold text-text-muted mt-0.5">
                {subject.code || "No code"} {subject.instructorName && `· ${subject.instructorName}`}
              </p>
              {subject.semester && (
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#7b2cbf]/15 text-[#7b2cbf] border border-[#7b2cbf]/40 dark:text-[#c77dff]">
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
              <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" className="text-gray-100 dark:text-[#1f1f35]" strokeWidth="8" />
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
              <span className={clsx("text-lg font-black", stats.statusColor === "green" ? "text-[#06d6a0]" : stats.statusColor === "yellow" ? "text-[#ff6b35]" : "text-[#ef476f]")}>
                {stats.currentPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="text-center p-3.5 bg-white dark:bg-[#0f0f1c] border-2 border-gray-200 dark:border-[#2a2a3d] rounded-2xl shadow-[0_3px_0_0_#d1d5db] dark:shadow-[0_3px_0_0_#0d0d1a]">
            <p className="text-2xl font-black text-text">{subject.totalClassesHeld}</p>
            <p className="text-xs font-bold text-text-muted mt-0.5">Conducted</p>
          </div>
          <div className="text-center p-3.5 bg-[#06d6a0]/10 border-2 border-[#06d6a0]/40 rounded-2xl shadow-[0_3px_0_0_#06d6a0]/30">
            <p className="text-2xl font-black text-[#06d6a0]">{subject.totalPresent}</p>
            <p className="text-xs font-extrabold text-[#06d6a0] mt-0.5">Present</p>
          </div>
          <div className="text-center p-3.5 bg-[#ef476f]/10 border-2 border-[#ef476f]/40 rounded-2xl shadow-[0_3px_0_0_#ef476f]/30">
            <p className="text-2xl font-black text-[#ef476f]">{subject.totalAbsent}</p>
            <p className="text-xs font-extrabold text-[#ef476f] mt-0.5">Absent</p>
          </div>
          <div className="text-center p-3.5 bg-[#ff6b35]/10 border-2 border-[#ff6b35]/40 rounded-2xl shadow-[0_3px_0_0_#ff6b35]/30">
            <p className="text-2xl font-black text-[#ff6b35]">{subject.totalLate}</p>
            <p className="text-xs font-extrabold text-[#ff6b35] mt-0.5">Late</p>
          </div>
          <div className="col-span-2 sm:col-span-1 text-center p-3.5 bg-gray-100 dark:bg-[#1f1f35] border-2 border-gray-200 dark:border-[#2a2a3d] rounded-2xl shadow-[0_3px_0_0_#d1d5db] dark:shadow-[0_3px_0_0_#0d0d1a]">
            <p className="text-2xl font-black text-[#1a1a2e] dark:text-[#c4c4d4]">{subject.totalCancelled || 0}</p>
            <p className="text-xs font-bold text-text-muted mt-0.5">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Bunk Calculator + Streak */}
      <div className="grid md:grid-cols-2 gap-4" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
        <div
          className={clsx(
            "card-3d p-6 transition-all",
            stats.isInDanger
              ? "border-[#ef476f]/40 shadow-[0_6px_0_0_#ef476f]"
              : "border-[#06d6a0]/40 shadow-[0_6px_0_0_#06d6a0]"
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={clsx(
                "w-10 h-10 rounded-2xl flex items-center justify-center border-2",
                stats.isInDanger
                  ? "bg-[#ef476f] border-[#cc1a42] text-white shadow-[0_3px_0_0_#9e1a38]"
                  : "bg-[#06d6a0] border-[#04b082] text-white shadow-[0_3px_0_0_#038c67]"
              )}
            >
              {stats.isInDanger ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-base text-text">
                {stats.isInDanger ? "Recovery Plan" : "Bunk Calculator"}
              </h3>
              <p className="text-xs font-semibold text-text-muted">Target: {subject.minAttendancePct}%</p>
            </div>
          </div>
          <p className={clsx("text-4xl font-black mb-1", stats.isInDanger ? "text-[#ef476f]" : "text-[#06d6a0]")}>
            {stats.isInDanger ? stats.mustAttendCount : stats.canSkipCount}
          </p>
          <p className="text-sm font-bold text-text-secondary">
            {stats.isInDanger
              ? `consecutive classes needed to reach ${subject.minAttendancePct}%`
              : `classes you can safely skip while staying above ${subject.minAttendancePct}%`}
          </p>
          <div className="mt-3 pt-3 border-t-2 border-gray-100 dark:border-[#2a2a3d] text-xs font-semibold text-text-muted leading-relaxed">
            {stats.reasoning}
          </div>
        </div>

        <div className="card-3d p-6 border-[#ff6b35]/40 shadow-[0_6px_0_0_#ff6b35]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff6b35] border-2 border-[#d95220] flex items-center justify-center text-white shadow-[0_3px_0_0_#b84114]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-text">Streak Stats</h3>
              <p className="text-xs font-semibold text-text-muted">Consistent attendance momentum</p>
            </div>
          </div>
          <p className="text-4xl font-black text-[#ff6b35] flex items-center gap-2 mb-1">
            <Flame className="w-8 h-8 text-[#ff6b35]" style={{ animation: "streakFlicker 1.5s ease-in-out infinite" }} /> {subject.streakCount} days
          </p>
          <p className="text-sm font-bold text-text-secondary">Best record: {subject.longestStreak} days</p>
        </div>
      </div>

      {/* Quick Mark Attendance */}
      <div
        className="card-3d p-6 sm:p-7"
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 150ms forwards" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center text-white shadow-[0_3px_0_0_#cc1a5e]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-text">Mark Attendance</h3>
            <p className="text-xs font-semibold text-text-muted">Quickly record your status for any class session</p>
          </div>
        </div>
        <div className="flex gap-4 items-end flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-[140px] w-full">
            <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Date</label>
            <input
              type="date"
              value={markDate}
              onChange={(e) => setMarkDate(e.target.value)}
              className="input-3d w-full text-sm font-semibold"
            />
          </div>
          {availableSlots.length > 0 && (
            <div className="flex-1 min-w-[140px] w-full">
              <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Slot</label>
              <select
                value={markScheduleId}
                onChange={(e) => setMarkScheduleId(e.target.value)}
                className="input-3d w-full text-sm font-semibold"
              >
                <option value="">Select a slot...</option>
                {availableSlots.map(slot => (
                  <option key={slot.id} value={slot.id}>{slot.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex-1 min-w-[140px] w-full">
            <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Status</label>
            <select
              value={markStatus}
              onChange={(e) => setMarkStatus(e.target.value)}
              className="input-3d w-full text-sm font-semibold"
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
            className={clsx(
              "w-full sm:w-auto px-6 py-2.5 text-sm font-black h-[46px] flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 transition-all duration-300",
              markSuccess
                ? clsx(
                    markStatus === "present" || markStatus === "excused"
                      ? "btn-3d-cyan mark-btn-flash-present"
                      : markStatus === "absent"
                      ? "btn-3d-coral mark-btn-flash-absent"
                      : markStatus === "late"
                      ? "btn-3d-yellow mark-btn-flash-late"
                      : "btn-3d-truegray mark-btn-flash-cancelled"
                  )
                : "btn-3d-primary"
            )}
          >
            {marking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : markSuccess ? (
              <>
                {markStatus === "present" || markStatus === "excused" ? (
                  <CheckCircle2 className="w-4 h-4 mark-btn-check-enter" />
                ) : markStatus === "absent" ? (
                  <XCircle className="w-4 h-4 mark-btn-check-enter" />
                ) : markStatus === "late" ? (
                  <Timer className="w-4 h-4 mark-btn-check-enter" />
                ) : (
                  <Ban className="w-4 h-4 mark-btn-check-enter" />
                )}
                <span className="mark-btn-check-enter">
                  {markStatus === "present" ? "Marked Present!"
                    : markStatus === "absent" ? "Marked Absent!"
                    : markStatus === "late" ? "Marked Late!"
                    : markStatus === "excused" ? "Marked Excused!"
                    : "Marked Cancelled!"}
                </span>
              </>
            ) : (
              "Mark Attendance"
            )}
          </button>
        </div>
      </div>

      {/* Schedule Section */}
      <div
        className="card-3d p-6 sm:p-7"
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 200ms forwards" }}
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4361ee] border-2 border-[#2b44c4] flex items-center justify-center text-white shadow-[0_3px_0_0_#2b44c4]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-text">Weekly Schedule</h3>
              <p className="text-xs font-semibold text-text-muted">Class timings and room venues</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openAddExtraClassModal}
              className="btn-3d-cyan px-3 py-1.5 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" /> Extra Class
            </button>
            <button
              onClick={openAddScheduleModal}
              className="btn-3d-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Slot
            </button>
          </div>
        </div>
        {subject.schedules?.length === 0 ? (
          <p className="text-text-muted text-sm py-6 text-center font-bold">No weekly schedule set yet.</p>
        ) : (
          <div className="space-y-2.5">
            {subject.schedules?.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3.5 card-3d transition-all"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-[#7b2cbf]/15 text-[#7b2cbf] border border-[#7b2cbf]/40 dark:text-[#c77dff]">
                    {DAYS[s.dayOfWeek]}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#6b6b80]" />
                    <span>{s.startTime} – {s.endTime}</span>
                  </div>
                  {s.room && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-text-muted">
                      <MapPin className="w-3.5 h-3.5 text-[#6b6b80]" />
                      <span>{s.room} {s.building && `(${s.building})`}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditScheduleModal(s)}
                    className="p-1.5 text-[#6b6b80] hover:text-[#FF2D78] transition rounded-lg hover:bg-gray-200 dark:hover:bg-white/5 cursor-pointer"
                    title="Edit slot"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(s.id)}
                    className="p-1.5 text-[#6b6b80] hover:text-[#ef476f] transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
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

      {/* Upcoming Extra Classes */}
      <div
        className="card-3d p-6 sm:p-7"
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 200ms forwards" }}
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7b2cbf] border-2 border-[#5a1c93] text-white flex items-center justify-center shadow-[0_3px_0_0_#461376]">
              <Zap className="w-5 h-5 text-[#c77dff]" />
            </div>
            <div>
              <h3 className="font-black text-base text-text">Upcoming Extra Classes</h3>
              <p className="text-xs font-semibold text-text-muted">Scheduled extra classes for this subject</p>
            </div>
          </div>
          <button
            onClick={openAddExtraClassModal}
            className="btn-3d-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule
          </button>
        </div>

        {upcomingExtraClasses.length === 0 ? (
          <p className="text-text-muted text-sm py-6 text-center font-bold">No upcoming extra classes scheduled.</p>
        ) : (
          <div className="space-y-2.5">
            {upcomingExtraClasses.map((cls: any) => {
              const roomMatch = cls.note?.match(/\((.*?)\)/);
              const room = roomMatch ? roomMatch[1] : "";
              const topicMatch = cls.note?.match(/Extra Class(?::\s*(.*?))?(?:\s*\(.*\))?$/);
              const topic = topicMatch && topicMatch[1] ? topicMatch[1].trim() : "";
              
              return (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3.5 card-3d transition-all"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-text">
                      {new Date(cls.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                    <span className="text-xs font-mono text-[#06d6a0] bg-[#06d6a0]/15 border border-[#06d6a0]/40 px-2 py-0.5 rounded-lg font-bold">
                      {cls.originalTime} - {cls.newTime}
                    </span>
                    {room && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-gray-100 text-[#4a4a5a] dark:bg-white/5 dark:text-[#a0a0b0] border border-gray-200 dark:border-[#2a2a3d]">
                        Room: {room}
                      </span>
                    )}
                    {topic && (
                      <span className="text-[10px] font-bold text-text-secondary px-2 py-0.5">
                        {topic}
                      </span>
                    )}
                    {cls.weight !== 1 && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-[#ef476f]/15 text-[#ef476f] border border-[#ef476f]/40">
                        Weight: {cls.weight}x
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditExtraClassModal(cls)}
                      className="p-1.5 text-[#6b6b80] hover:text-[#06d6a0] transition rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer"
                      title="Edit extra class"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExtraClass(cls.id)}
                      className="p-1.5 text-[#6b6b80] hover:text-[#ef476f] transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                      title="Delete extra class"
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

      {/* Subject Reminders & Tasks */}
      <div
        className="card-3d p-6 sm:p-7"
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 250ms forwards" }}
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff6b35] border-2 border-[#d95220] text-white flex items-center justify-center shadow-[0_3px_0_0_#b84114]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-text">Subject Reminders & Tasks</h3>
              <p className="text-xs font-semibold text-text-muted">Assignments, tests & deadlines for {subject.name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowSubjectReminderModal(true)}
            className="btn-3d-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Reminder
          </button>
        </div>

        {subjectReminders.length === 0 ? (
          <p className="text-text-muted text-sm py-6 text-center font-bold">No reminders for this subject yet.</p>
        ) : (
          <div className="space-y-2.5">
            {subjectReminders.map((rem: any) => (
              <div
                key={rem.id}
                className={clsx(
                  "flex items-center justify-between p-3.5 card-3d transition-all",
                  rem.isCompleted && "opacity-50 line-through"
                )}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => toggleSubjectReminder(rem.id, rem.isCompleted)}
                    className="text-[#6b6b80] hover:text-[#06d6a0] transition cursor-pointer"
                  >
                    {rem.isCompleted ? <CheckCircle2 className="w-4 h-4 text-[#06d6a0]" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <span className="text-sm font-bold text-text">{rem.title}</span>
                  <span className="text-xs font-mono text-[#ff6b35] bg-[#ff6b35]/15 border border-[#ff6b35]/40 px-2 py-0.5 rounded-lg font-bold">
                    {new Date(rem.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-gray-100 text-[#4a4a5a] dark:bg-white/5 dark:text-[#a0a0b0] border border-gray-200 dark:border-[#2a2a3d]">
                    {rem.category.replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={() => deleteSubjectReminder(rem.id)}
                  className="p-1.5 text-[#6b6b80] hover:text-[#ef476f] transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
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
        className="card-3d p-6 sm:p-7"
        style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 300ms forwards" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FF2D78] border-2 border-[#cc1a5e] flex items-center justify-center text-white shadow-[0_3px_0_0_#cc1a5e]">
            <CalIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-text">Recent Attendance Records</h3>
            <p className="text-xs font-semibold text-text-muted">Detailed historical record of past classes</p>
          </div>
        </div>
        {subject.attendanceRecords?.length === 0 ? (
          <p className="text-text-muted text-sm py-6 text-center font-bold">No records logged yet.</p>
        ) : (
          <div className="space-y-2.5">
            {subject.attendanceRecords?.map((r: any) => {
              const isExtraClass = r.source === "extra_class" || r.notes?.includes("Extra Class");
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3.5 card-3d transition-all"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <CalIcon className="w-4 h-4 text-[#6b6b80]" />
                    <span className="text-sm font-bold text-[#1a1a2e] dark:text-gray-200">
                      {new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className={clsx("px-2.5 py-0.5 rounded-lg text-xs font-black capitalize", STATUS_COLORS[r.status])}>
                      {r.status}
                    </span>
                    {isExtraClass && (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#00f5d4]/15 text-[#00f5d4] border border-[#00f5d4]/40 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Extra Class
                      </span>
                    )}
                    {r.notes && !isExtraClass && (
                      <span className="text-xs text-text-muted italic">({r.notes})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditAttendanceModal(r)}
                      className="p-1.5 text-[#6b6b80] hover:text-[#FF2D78] transition rounded-lg hover:bg-gray-200 dark:hover:bg-white/5 cursor-pointer"
                      title="Edit record"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRecord(r.id)}
                      className="p-1.5 text-[#6b6b80] hover:text-[#ef476f] transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-overlay">
          <div className="rounded-2xl p-6 sm:p-7 max-w-md w-full border-2 border-gray-200 bg-white shadow-[0_12px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_12px_0_0_#0d0d1a] space-y-4">
            <h3 className="text-xl font-black text-text">Edit Subject</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Subject Name</label>
                <input
                  type="text"
                  value={editSubjectData.name}
                  onChange={e => setEditSubjectData({...editSubjectData, name: e.target.value})}
                  className="input-3d w-full text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Course Code (Optional)</label>
                <input
                  type="text"
                  value={editSubjectData.code}
                  onChange={e => setEditSubjectData({...editSubjectData, code: e.target.value})}
                  className="input-3d w-full text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Instructor (Optional)</label>
                <input
                  type="text"
                  value={editSubjectData.instructorName}
                  onChange={e => setEditSubjectData({...editSubjectData, instructorName: e.target.value})}
                  className="input-3d w-full text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Min. Attendance %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editSubjectData.minAttendancePct}
                  onChange={e => setEditSubjectData({...editSubjectData, minAttendancePct: parseInt(e.target.value) || 0})}
                  className="input-3d w-full text-sm font-semibold"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditSubjectModal(false)}
                className="btn-3d-secondary flex-1 py-2.5 text-sm font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSubject}
                disabled={savingSubject}
                className="btn-3d-primary flex-1 py-2.5 text-sm font-black disabled:opacity-50 cursor-pointer"
              >
                {savingSubject ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-overlay">
          <div className="rounded-2xl p-6 max-w-sm w-full border-2 border-gray-200 bg-white shadow-[0_12px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_12px_0_0_#0d0d1a] space-y-4">
            <h3 className="text-xl font-black text-text">Edit Record</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Date</label>
                <input
                  type="date"
                  value={editRecordDate}
                  onChange={e => setEditRecordDate(e.target.value)}
                  className="input-3d w-full text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Status</label>
                <select
                  value={editRecordStatus}
                  onChange={e => setEditRecordStatus(e.target.value)}
                  className="input-3d w-full text-sm font-semibold"
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
                className="btn-3d-secondary flex-1 py-2.5 text-sm font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={savingRecord}
                className="btn-3d-primary flex-1 py-2.5 text-sm font-black disabled:opacity-50 cursor-pointer"
              >
                {savingRecord ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-overlay">
          <form
            onSubmit={handleSaveSchedule}
            className="rounded-2xl p-6 max-w-sm w-full border-2 border-gray-200 bg-white shadow-[0_12px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_12px_0_0_#0d0d1a] space-y-4"
          >
            <h3 className="text-xl font-black text-text">
              {scheduleMode === "add" ? "Add Schedule" : "Edit Schedule"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Day of Week</label>
                <select
                  value={scheduleForm.dayOfWeek}
                  onChange={e => setScheduleForm({ ...scheduleForm, dayOfWeek: Number(e.target.value) })}
                  className="input-3d w-full text-sm font-semibold"
                >
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    required
                    className="input-3d w-full text-sm font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    required
                    className="input-3d w-full text-sm font-mono font-semibold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Room (Optional)</label>
                  <input
                    type="text"
                    value={scheduleForm.room}
                    onChange={e => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                    className="input-3d w-full text-sm font-semibold placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Building (Optional)</label>
                  <input
                    type="text"
                    value={scheduleForm.building}
                    onChange={e => setScheduleForm({ ...scheduleForm, building: e.target.value })}
                    className="input-3d w-full text-sm font-semibold placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="btn-3d-secondary flex-1 py-2.5 text-sm font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSchedule}
                className="btn-3d-primary flex-1 py-2.5 text-sm font-black disabled:opacity-50 cursor-pointer"
              >
                {savingSchedule ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Extra Class Modal */}
      {showExtraClassModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-overlay">
          <form
            onSubmit={handleSaveExtraClass}
            className="rounded-2xl p-6 sm:p-7 max-w-md w-full border-2 border-[#00f5d4]/40 bg-white shadow-[0_12px_0_0_#00c4a7] dark:border-[#00f5d4]/40 dark:bg-[#141425] dark:shadow-[0_12px_0_0_#0d0d1a] space-y-4"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00f5d4] border-2 border-[#00c4a7] flex items-center justify-center shadow-[0_3px_0_0_#00a890] shrink-0 text-[#0d0d1a]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-text">
                    {extraClassMode === "add" ? "Schedule Extra Class" : "Edit Extra Class"}
                  </h3>
                  <p className="text-xs font-semibold text-text-muted">
                    {extraClassMode === "add" ? `Add a one-off or makeup lecture for ${subject.name}` : `Modify the details of this extra class for ${subject.name}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExtraClassModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Date</label>
                <input
                  type="date"
                  value={extraClassForm.date}
                  onChange={e => setExtraClassForm({ ...extraClassForm, date: e.target.value })}
                  required
                  className="input-3d w-full text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={extraClassForm.startTime}
                    onChange={e => setExtraClassForm({ ...extraClassForm, startTime: e.target.value })}
                    required
                    className="input-3d w-full text-sm font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={extraClassForm.endTime}
                    onChange={e => setExtraClassForm({ ...extraClassForm, endTime: e.target.value })}
                    required
                    className="input-3d w-full text-sm font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Room / Venue (Optional)</label>
                <input
                  type="text"
                  value={extraClassForm.room}
                  onChange={e => setExtraClassForm({ ...extraClassForm, room: e.target.value })}
                  placeholder="e.g. Hall 301 / Lab B"
                  className="input-3d w-full text-sm font-semibold placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Topic / Notes (Optional)</label>
                <input
                  type="text"
                  value={extraClassForm.topic}
                  onChange={e => setExtraClassForm({ ...extraClassForm, topic: e.target.value })}
                  placeholder="e.g. Revision / Special Lecture"
                  className="input-3d w-full text-sm font-semibold placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Number of Classes (Weight)</label>
                <input
                  type="number"
                  min="1"
                  value={extraClassForm.weight}
                  onChange={e => setExtraClassForm({ ...extraClassForm, weight: parseInt(e.target.value) || 1 })}
                  className="input-3d w-full text-sm font-semibold"
                />
              </div>

              {extraClassMode === "add" && (
                <label className="flex items-center gap-2 text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={addReminderForExtraClass}
                    onChange={e => setAddReminderForExtraClass(e.target.checked)}
                    className="rounded accent-[#00f5d4] w-4 h-4 cursor-pointer"
                  />
                  Also create a reminder for this extra class
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExtraClassModal(false)}
                className="btn-3d-secondary flex-1 py-2.5 text-sm font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingExtraClass}
                className="btn-3d-cyan flex-1 py-2.5 text-sm font-black flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingExtraClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Save Extra Class
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Subject Reminder Modal */}
      {showSubjectReminderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-overlay">
          <form
            onSubmit={handleSaveSubjectReminder}
            className="rounded-2xl p-6 sm:p-7 max-w-md w-full border-2 border-[#ff6b35]/40 bg-white shadow-[0_12px_0_0_#d95220] dark:border-[#ff6b35]/40 dark:bg-[#141425] dark:shadow-[0_12px_0_0_#0d0d1a] space-y-4"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-[#ff6b35] border-2 border-[#d95220] flex items-center justify-center shadow-[0_3px_0_0_#b84114] shrink-0 text-white">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-text">New Subject Reminder</h3>
                <p className="text-xs font-semibold text-text-muted">Set assignment, exam or task deadline for {subject.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Title *</label>
                <input
                  type="text"
                  value={subjectReminderForm.title}
                  onChange={e => setSubjectReminderForm({ ...subjectReminderForm, title: e.target.value })}
                  placeholder="e.g. Lab Report Submission"
                  required
                  className="input-3d w-full text-sm font-semibold placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Category</label>
                  <select
                    value={subjectReminderForm.category}
                    onChange={e => setSubjectReminderForm({ ...subjectReminderForm, category: e.target.value })}
                    className="input-3d w-full text-sm font-semibold"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="extra_class">Extra Class</option>
                    <option value="exam">Exam / Test</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Priority</label>
                  <select
                    value={subjectReminderForm.priority}
                    onChange={e => setSubjectReminderForm({ ...subjectReminderForm, priority: e.target.value })}
                    className="input-3d w-full text-sm font-semibold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Due Date *</label>
                  <input
                    type="date"
                    value={subjectReminderForm.dueDate}
                    onChange={e => setSubjectReminderForm({ ...subjectReminderForm, dueDate: e.target.value })}
                    required
                    className="input-3d w-full text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Due Time</label>
                  <input
                    type="time"
                    value={subjectReminderForm.dueTime}
                    onChange={e => setSubjectReminderForm({ ...subjectReminderForm, dueTime: e.target.value })}
                    className="input-3d w-full text-sm font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Notification Channels */}
              <div className="p-3.5 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#ff6b35]">
                  Notify Me Via:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-[#0f0f1c] border-2 border-gray-200 dark:border-[#2a2a3d] font-bold text-[#1a1a2e] dark:text-[#c4c4d4]">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyPush}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyPush: e.target.checked })}
                      className="rounded accent-[#ff6b35] cursor-pointer"
                    />
                    <Bell className="w-3.5 h-3.5 text-[#ff6b35]" />
                    <span>Browser Push</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-[#0f0f1c] border-2 border-gray-200 dark:border-[#2a2a3d] font-bold text-[#1a1a2e] dark:text-[#c4c4d4]">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyAlarm}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyAlarm: e.target.checked })}
                      className="rounded accent-[#ff6b35] cursor-pointer"
                    />
                    <Volume2 className="w-3.5 h-3.5 text-[#ff6b35]" />
                    <span>Alarm Sound</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-[#0f0f1c] border-2 border-gray-200 dark:border-[#2a2a3d] font-bold text-[#1a1a2e] dark:text-[#c4c4d4]">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyEmail}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyEmail: e.target.checked })}
                      className="rounded accent-[#ff6b35] cursor-pointer"
                    />
                    <Mail className="w-3.5 h-3.5 text-[#4361ee]" />
                    <span>Email Alert</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-[#0f0f1c] border-2 border-gray-200 dark:border-[#2a2a3d] font-bold text-[#1a1a2e] dark:text-[#c4c4d4]">
                    <input
                      type="checkbox"
                      checked={subjectReminderForm.notifyTelegram}
                      onChange={(e) => setSubjectReminderForm({ ...subjectReminderForm, notifyTelegram: e.target.checked })}
                      className="rounded accent-[#ff6b35] cursor-pointer"
                    />
                    <MessageSquare className="w-3.5 h-3.5 text-[#00f5d4]" />
                    <span>Telegram</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Description (Optional)</label>
                <textarea
                  value={subjectReminderForm.description}
                  onChange={e => setSubjectReminderForm({ ...subjectReminderForm, description: e.target.value })}
                  placeholder="Details, questions to solve, submission portal..."
                  rows={2}
                  className="input-3d w-full text-xs font-medium placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubjectReminderModal(false)}
                className="btn-3d-secondary flex-1 py-2.5 text-sm font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSubjectReminder}
                className="btn-3d-coral flex-1 py-2.5 text-sm font-black flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingSubjectReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />} Save Reminder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-overlay">
          <div className="rounded-2xl p-6 sm:p-7 max-w-md w-full border-2 border-gray-200 bg-white shadow-[0_12px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_12px_0_0_#0d0d1a] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ef476f]/15 text-[#ef476f] border-2 border-[#ef476f]/40 flex items-center justify-center shadow-[0_3px_0_0_#ef476f]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-text">Delete {subject.name}?</h3>
                <p className="text-xs font-semibold text-text-muted">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm font-medium text-text-secondary">
              This will permanently delete <strong className="text-text font-bold">{subject.name}</strong>, its schedules, and all attendance logs.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-3d-secondary flex-1 py-2.5 text-sm font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubject}
                className="btn-3d-coral text-white font-black flex-1 py-2.5 text-sm cursor-pointer"
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
