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
              ? "bg-[#FF2D78] border-2 border-[#cc1a5e] text-white shadow-[0_3px_0_0_#cc1a5e]"
              : "bg-gray-100 border-2 border-gray-200 text-gray-400 dark:bg-[#141425] dark:border-[#2a2a3d] dark:text-gray-500"
          }`}
        >
          1
        </div>
        <div
          className={`h-1.5 w-12 rounded-full transition-all ${
            step >= 2 ? "bg-[#FF2D78]" : "bg-gray-200 dark:bg-[#2a2a3d]"
          }`}
        />
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${
            step >= 2
              ? "bg-[#FF2D78] border-2 border-[#cc1a5e] text-white shadow-[0_3px_0_0_#cc1a5e]"
              : "bg-gray-100 border-2 border-gray-200 text-gray-400 dark:bg-[#141425] dark:border-[#2a2a3d] dark:text-gray-500"
          }`}
        >
          2
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#ef476f]/15 border-2 border-[#ef476f]/40 text-[#ef476f] text-sm font-bold mb-6 shadow-[0_3px_0_0_#9e1a38]">
          {error}
        </div>
      )}

      {step === 1 ? (
        <form
          onSubmit={handleCreateSubject}
          className="card-3d p-6 sm:p-8 space-y-6"
          style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}
        >
          <div>
            <h2 className="text-xl font-black text-[#1a1a2e] dark:text-white tracking-tight">Subject Details</h2>
            <p className="text-xs font-semibold text-[#4a4a5a] dark:text-[#6b6b80] mt-1">Configure your course metadata and attendance targets.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Subject Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              required
              className="input-3d w-full text-sm font-medium"
              placeholder="e.g. Data Structures & Algorithms"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Subject Code (Optional)</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => updateForm("code", e.target.value)}
                className="input-3d w-full text-sm font-medium"
                placeholder="CS301"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1.5">Instructor (Optional)</label>
              <input
                type="text"
                value={form.instructorName}
                onChange={(e) => updateForm("instructorName", e.target.value)}
                className="input-3d w-full text-sm font-medium"
                placeholder="Prof. Sharma"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4]">Minimum Required Attendance</label>
              <span className="text-sm font-black text-[#FF2D78]">{form.minAttendancePct}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={form.minAttendancePct}
              onChange={(e) => updateForm("minAttendancePct", parseInt(e.target.value))}
              className="w-full accent-[#FF2D78] cursor-pointer"
            />
            <div className="flex justify-between text-xs font-bold text-gray-400 dark:text-gray-500 mt-1">
              <span>50%</span>
              <span>75% (Standard)</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-2">Subject Color Tag</label>
            <div className="flex gap-2.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateForm("colorHex", c)}
                  className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 cursor-pointer shadow-[0_2px_0_0_rgba(0,0,0,0.2)] ${
                    form.colorHex === c ? "border-white scale-110 ring-2 ring-[#FF2D78]" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f0f1c] border-2 border-gray-200 dark:border-[#2a2a3d] rounded-2xl">
            <div>
              <span className="text-sm font-bold text-[#1a1a2e] dark:text-white block">Reminders & Notifications</span>
              <span className="text-xs font-medium text-[#4a4a5a] dark:text-[#6b6b80]">Receive alerts before scheduled lectures</span>
            </div>
            <button
              type="button"
              onClick={() => updateForm("reminderEnabled", !form.reminderEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer border border-black/10 ${
                form.reminderEnabled ? "bg-[#FF2D78]" : "bg-gray-200 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                  form.reminderEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 btn-3d-primary rounded-2xl font-black text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Next: Add Schedule
          </button>
        </form>
      ) : (
        <div
          className="card-3d p-6 sm:p-8 space-y-6"
          style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}
        >
          <div>
            <h2 className="text-xl font-black text-[#1a1a2e] dark:text-white tracking-tight">Class Schedule</h2>
            <p className="text-xs font-semibold text-[#4a4a5a] dark:text-[#6b6b80] mt-1">When does this class meet weekly?</p>
          </div>

          <div className="space-y-3">
            {schedules.map((sched, i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 bg-gray-50 dark:bg-[#0f0f1c] border-2 border-gray-200 dark:border-[#2a2a3d] rounded-2xl"
              >
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1">Day</label>
                  <select
                    value={sched.dayOfWeek}
                    onChange={(e) => updateSchedule(i, "dayOfWeek", parseInt(e.target.value))}
                    className="input-3d w-full text-sm font-semibold"
                  >
                    {DAYS.map((d, di) => <option key={di} value={di}>{d}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1">Start Time</label>
                  <input
                    type="time"
                    value={sched.startTime}
                    onChange={(e) => updateSchedule(i, "startTime", e.target.value)}
                    className="input-3d w-full text-sm font-mono font-semibold"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1">End Time</label>
                  <input
                    type="time"
                    value={sched.endTime}
                    onChange={(e) => updateSchedule(i, "endTime", e.target.value)}
                    className="input-3d w-full text-sm font-mono font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1a1a2e] dark:text-[#c4c4d4] mb-1">Room</label>
                  <input
                    type="text"
                    value={sched.room}
                    onChange={(e) => updateSchedule(i, "room", e.target.value)}
                    className="input-3d w-full text-sm placeholder-gray-400 font-semibold"
                    placeholder="Hall 301"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  {schedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScheduleSlot(i)}
                      className="p-2 text-[#ef476f] hover:bg-[#ef476f]/10 rounded-xl transition cursor-pointer"
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
            className="flex items-center gap-2 text-[#FF2D78] text-sm font-black hover:underline transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add another time slot
          </button>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/subjects")}
              className="btn-3d-secondary flex-1 py-3 text-sm font-bold cursor-pointer"
            >
              Skip Schedule
            </button>
            <button
              type="button"
              onClick={handleSaveSchedules}
              disabled={loading}
              className="btn-3d-primary flex-1 py-3 text-sm font-black disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save & Finish
            </button>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
