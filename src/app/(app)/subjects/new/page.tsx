"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/hooks/useApi";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

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
  });

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
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link href="/subjects" className="flex items-center gap-2 text-gray-400 text-sm mb-6 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Subjects
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white" : "bg-white/10 text-gray-500"}`}>1</div>
        <div className={`h-0.5 w-12 ${step >= 2 ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10"}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white" : "bg-white/10 text-gray-500"}`}>2</div>
      </div>

      {error && <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl mb-4 border border-red-500/20">{error}</div>}

      {step === 1 ? (
        <form onSubmit={handleCreateSubject} className="glass rounded-2xl p-6 space-y-5">
          <h2 className="text-xl font-bold text-gradient">Subject Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Subject Name *</label>
            <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} required
              className="input-glass w-full px-4 py-2.5 rounded-xl text-sm"
              placeholder="e.g., Data Structures" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Subject Code</label>
              <input type="text" value={form.code} onChange={(e) => updateForm("code", e.target.value)}
                className="input-glass w-full px-4 py-2.5 rounded-xl text-sm"
                placeholder="CS301" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Instructor</label>
              <input type="text" value={form.instructorName} onChange={(e) => updateForm("instructorName", e.target.value)}
                className="input-glass w-full px-4 py-2.5 rounded-xl text-sm"
                placeholder="Prof. Sharma" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Minimum Attendance Required: {form.minAttendancePct}%</label>
            <input type="range" min={50} max={100} step={5} value={form.minAttendancePct}
              onChange={(e) => updateForm("minAttendancePct", parseInt(e.target.value))}
              className="w-full accent-purple-500" />
            <div className="flex justify-between text-xs text-gray-500"><span>50%</span><span>100%</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => updateForm("colorHex", c)}
                  className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${form.colorHex === c ? "border-white scale-110 shadow-lg" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <span className="text-sm text-text-secondary">Telegram & Email Reminders</span>
            <button type="button" onClick={() => updateForm("reminderEnabled", !form.reminderEnabled)}
              className={`w-10 h-6 rounded-full transition ${form.reminderEnabled ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10"}`}>
              <div className={`w-4 h-4 bg-white rounded-full transform transition ${form.reminderEnabled ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="btn-gradient w-full py-3 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Next: Add Schedule
          </button>
        </form>
      ) : (
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="text-xl font-bold text-gradient">Class Schedule</h2>
          <p className="text-sm text-gray-400">When does this class meet?</p>

          {schedules.map((sched, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-end p-4 bg-white/5 rounded-xl">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">Day</label>
                <select value={sched.dayOfWeek} onChange={(e) => updateSchedule(i, "dayOfWeek", parseInt(e.target.value))}
                  className="input-glass w-full px-3 py-2 rounded-xl text-sm">
                  {DAYS.map((d, di) => <option key={di} value={di}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">Start</label>
                <input type="time" value={sched.startTime} onChange={(e) => updateSchedule(i, "startTime", e.target.value)}
                  className="input-glass w-full px-3 py-2 rounded-xl text-sm" />
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">End</label>
                <input type="time" value={sched.endTime} onChange={(e) => updateSchedule(i, "endTime", e.target.value)}
                  className="input-glass w-full px-3 py-2 rounded-xl text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Room</label>
                <input type="text" value={sched.room} onChange={(e) => updateSchedule(i, "room", e.target.value)}
                  className="input-glass w-full px-3 py-2 rounded-xl text-sm" placeholder="301" />
              </div>
              <div className="col-span-1">
                {schedules.length > 1 && (
                  <button onClick={() => removeScheduleSlot(i)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          <button onClick={addScheduleSlot} className="flex items-center gap-2 text-purple-400 text-sm font-medium hover:text-purple-300 transition">
            <Plus className="w-4 h-4" /> Add another time slot
          </button>

          <div className="flex gap-3">
            <button onClick={() => router.push("/subjects")}
              className="btn-ghost flex-1 py-3 rounded-xl font-medium transition">
              Skip Schedule
            </button>
            <button onClick={handleSaveSchedules} disabled={loading}
              className="btn-gradient flex-1 py-3 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save & Finish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
