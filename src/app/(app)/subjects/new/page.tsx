"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/hooks/useApi";
import { ArrowLeft, Loader2, Plus, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/PageTransition";

const COLORS = ["#6366F1","#EC4899","#F59E0B","#22C55E","#06B6D4","#8B5CF6","#EF4444","#14B8A6","#F97316","#3B82F6","#A855F7","#84CC16"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function NewSubjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [form, setForm] = useState({
    name: "", code: "", instructorName: "",
    minAttendancePct: 75, colorHex: "#6366F1",
    reminderEnabled: true, reminderBeforeMin: 15,
    semesterId: "",
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sid = searchParams.get("semesterId");
    if (sid) {
      setForm((p) => ({ ...p, semesterId: sid }));
    }
  }, []);

  const [schedules, setSchedules] = useState<{
    dayOfWeek: number; startTime: string; endTime: string; room: string;
  }[]>([{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "" }]);

  function updateForm(field: string, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleCreateSubject(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/subjects", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSubjectId(data.subject.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subject");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSchedules() {
    setLoading(true);
    try {
      for (const sched of schedules) {
        if (!sched.startTime || !sched.endTime) continue;
        await apiFetch("/schedules", {
          method: "POST",
          body: JSON.stringify({ ...sched, subjectId }),
        });
      }
      router.push("/subjects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save schedule");
    } finally {
      setLoading(false);
    }
  }

  function addScheduleSlot() {
    setSchedules([...schedules, { dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "" }]);
  }

  function removeScheduleSlot(index: number) {
    setSchedules(schedules.filter((_, i) => i !== index));
  }

  function updateSchedule(index: number, field: string, value: unknown) {
    setSchedules(schedules.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-2xl mx-auto pb-12">
      <Link
        href="/subjects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Subjects
      </Link>

      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-6" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${
            step >= 1
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20"
              : "bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500"
          }`}
        >
          1
        </div>
        <div
          className={`h-1 w-12 rounded-full transition-all ${
            step >= 2 ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-200 dark:bg-white/10"
          }`}
        />
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${
            step >= 2
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20"
              : "bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500"
          }`}
        >
          2
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 text-sm font-medium mb-6">
          {error}
        </div>
      )}

      {step === 1 ? (
        <form
          onSubmit={handleCreateSubject}
          className="rounded-3xl p-6 sm:p-8 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl space-y-6"
          style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}
        >
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Subject Details</h2>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Configure your course metadata and attendance targets.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Subject Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
              placeholder="e.g. Data Structures & Algorithms"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Subject Code (Optional)</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => updateForm("code", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                placeholder="CS301"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Instructor (Optional)</label>
              <input
                type="text"
                value={form.instructorName}
                onChange={(e) => updateForm("instructorName", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium"
                placeholder="Prof. Sharma"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Minimum Required Attendance</label>
              <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">{form.minAttendancePct}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={form.minAttendancePct}
              onChange={(e) => updateForm("minAttendancePct", parseInt(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs font-bold text-gray-400 dark:text-gray-500 mt-1">
              <span>50%</span>
              <span>75% (Standard)</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Subject Color Tag</label>
            <div className="flex gap-2.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateForm("colorHex", c)}
                  className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 cursor-pointer ${
                    form.colorHex === c ? "border-purple-600 scale-110 shadow-md" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.08] rounded-2xl">
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-white block">Reminders & Notifications</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Receive alerts before scheduled lectures</span>
            </div>
            <button
              type="button"
              onClick={() => updateForm("reminderEnabled", !form.reminderEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                form.reminderEnabled ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-200 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  form.reminderEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Next: Add Schedule
          </button>
        </form>
      ) : (
        <div
          className="rounded-3xl p-6 sm:p-8 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl space-y-6"
          style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}
        >
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Class Schedule</h2>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">When does this class meet weekly?</p>
          </div>

          <div className="space-y-3">
            {schedules.map((sched, i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.08] rounded-2xl"
              >
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Day</label>
                  <select
                    value={sched.dayOfWeek}
                    onChange={(e) => updateSchedule(i, "dayOfWeek", parseInt(e.target.value))}
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl text-sm font-medium text-gray-900 dark:text-white"
                  >
                    {DAYS.map((d, di) => <option key={di} value={di}>{d}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={sched.startTime}
                    onChange={(e) => updateSchedule(i, "startTime", e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl text-sm font-mono text-gray-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={sched.endTime}
                    onChange={(e) => updateSchedule(i, "endTime", e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl text-sm font-mono text-gray-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Room</label>
                  <input
                    type="text"
                    value={sched.room}
                    onChange={(e) => updateSchedule(i, "room", e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400"
                    placeholder="Hall 301"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  {schedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScheduleSlot(i)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                      title="Remove slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addScheduleSlot}
            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm font-bold hover:underline transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add another time slot
          </button>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/subjects")}
              className="flex-1 py-3 rounded-2xl font-bold text-sm border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition cursor-pointer"
            >
              Skip Schedule
            </button>
            <button
              type="button"
              onClick={handleSaveSchedules}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save & Finish
            </button>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
