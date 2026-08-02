"use client";

import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { useSWRFetch, invalidate } from "@/hooks/useSWRFetch";
import { apiFetch } from "@/hooks/useApi";
import {
  Bell, Plus, CheckCircle2, Circle, Trash2, Calendar, Clock,
  BookOpen, Filter, AlertCircle, Sparkles, Tag, Check, Zap, FileText, Bookmark,
  Mail, MessageSquare, Volume2
, AlarmClock } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  category: "assignment" | "extra_class" | "exam" | "other";
  dueDate: string;
  dueTime: string | null;
  priority: "low" | "medium" | "high";
  isCompleted: boolean;
  notifyPush: boolean;
  notifyAlarm: boolean;
  notifyEmail: boolean;
  notifyTelegram: boolean;
  subjectId: string | null;
  subject?: {
    id: string;
    name: string;
    colorHex: string;
    code: string | null;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
  colorHex: string;
}

const CATEGORIES = [
  { id: "all", label: "All Reminders", icon: Bell },
  { id: "assignment", label: "Assignments", icon: FileText },
  { id: "extra_class", label: "Extra Classes", icon: Zap },
  { id: "exam", label: "Exams & Tests", icon: Bookmark },
  { id: "other", label: "Other", icon: Tag },
];

const PRIORITY_BADGES = {
  high: "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
  medium: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  low: "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30",
};

export default function RemindersPage() {
  const { data: remindersData, isLoading } = useSWRFetch<{ reminders: Reminder[] }>("/reminders");
  const { data: subjectsData } = useSWRFetch<{ subjects: Subject[] }>("/subjects");

  const [activeCategory, setActiveCategory] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "assignment",
    dueDate: new Date().toISOString().slice(0, 10),
    dueTime: "12:00",
    priority: "medium",
    subjectId: "",
    notifyPush: true,
    notifyAlarm: true,
    notifyEmail: false,
    notifyTelegram: false,
  });

  const reminders = remindersData?.reminders || [];
  const subjects = subjectsData?.subjects || [];

  const filteredReminders = reminders.filter((r) => {
    if (!showCompleted && r.isCompleted) return false;
    if (activeCategory !== "all" && r.category !== activeCategory) return false;
    return true;
  });

  async function handleToggleComplete(reminder: Reminder) {
    try {
      await apiFetch(`/reminders/${reminder.id}`, {
        method: "PUT",
        body: JSON.stringify({ isCompleted: !reminder.isCompleted }),
      });
      await invalidate("/reminders");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(reminderId: string) {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    try {
      await apiFetch(`/reminders/${reminderId}`, { method: "DELETE" });
      await invalidate("/reminders");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSubmitting(true);
    try {
      await apiFetch("/reminders", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          dueDate: form.dueDate,
          dueTime: form.dueTime,
          priority: form.priority,
          subjectId: form.subjectId || null,
          notifyPush: form.notifyPush,
          notifyAlarm: form.notifyAlarm,
          notifyEmail: form.notifyEmail,
          notifyTelegram: form.notifyTelegram,
        }),
      });

      setShowModal(false);
      setForm({
        title: "",
        description: "",
        category: "assignment",
        dueDate: new Date().toISOString().slice(0, 10),
        dueTime: "12:00",
        priority: "medium",
        subjectId: "",
        notifyPush: true,
        notifyAlarm: true,
        notifyEmail: false,
        notifyTelegram: false,
      });
      await invalidate("/reminders");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 rounded-3xl p-6 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl transition-all" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reminders & Tasks</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">Keep track of extra classes, assignments, exams & deadlines</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-2 shadow-md shadow-amber-500/20 hover:shadow-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Reminder
        </button>
      </div>

      {/* Filter Tabs & Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer border",
                  active
                    ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20"
                    : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:text-white"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-semibold transition border flex items-center gap-2 ml-auto cursor-pointer",
            showCompleted
              ? "bg-gray-100 text-gray-900 border-gray-300 dark:bg-white/10 dark:text-white dark:border-white/20"
              : "bg-white border-gray-200 text-gray-500 hover:text-gray-900 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:text-white"
          )}
        >
          <Check className="w-3.5 h-3.5 text-teal-500" />
          {showCompleted ? "Hide Completed" : "Show Completed"}
        </button>
      </div>

      {/* Reminders List */}
      {isLoading ? (
        <FuturisticLoader variant="section" title="Loading reminders" Icon={AlarmClock} />
      ) : filteredReminders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl space-y-3" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Reminders Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {activeCategory !== "all"
              ? `No reminders listed under ${activeCategory.replace("_", " ")}.`
              : "You don't have any pending reminders. Click below to add one!"}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white inline-flex items-center gap-1.5 mt-2 shadow-md shadow-cyan-500/20 hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Reminder
          </button>
        </div>
      ) : (
        <StaggerGrid className="space-y-3" delay={100} staggerDelay={50} animation="fadeSlideUp">
          {filteredReminders.map((reminder) => (
            <div
              key={reminder.id}
              className={clsx(
                "p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group",
                reminder.isCompleted
                  ? "bg-gray-50/80 border-gray-200 text-gray-400 dark:bg-white/[0.02] dark:border-white/5 line-through opacity-60"
                  : "bg-white border-gray-200/70 hover:border-amber-400/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:hover:border-amber-500/40"
              )}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() => handleToggleComplete(reminder)}
                  className="mt-0.5 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition shrink-0 cursor-pointer"
                >
                  {reminder.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-white text-base leading-snug">
                      {reminder.title}
                    </span>
                    {reminder.subject && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                        style={{
                          backgroundColor: `${reminder.subject.colorHex}15`,
                          borderColor: `${reminder.subject.colorHex}40`,
                          color: reminder.subject.colorHex,
                        }}
                      >
                        {reminder.subject.name}
                      </span>
                    )}
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                        PRIORITY_BADGES[reminder.priority]
                      )}
                    >
                      {reminder.priority}
                    </span>
                  </div>

                  {reminder.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{reminder.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 flex-wrap pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-amber-500" />
                      {new Date(reminder.dueDate).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {reminder.dueTime && (
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-cyan-500" />
                        {reminder.dueTime}
                      </span>
                    )}
                    <span className="capitalize px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-medium">
                      {reminder.category.replace("_", " ")}
                    </span>

                    {/* Active Channels Icons */}
                    <div className="flex items-center gap-1.5 ml-auto text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Channels:</span>
                      {reminder.notifyPush && <span title="Browser Push Notification"><Bell className="w-3 h-3 text-amber-500" /></span>}
                      {reminder.notifyAlarm && <span title="Alarm Sound"><Volume2 className="w-3 h-3 text-amber-500" /></span>}
                      {reminder.notifyEmail && <span title="Email Alert"><Mail className="w-3 h-3 text-blue-500" /></span>}
                      {reminder.notifyTelegram && <span title="Telegram Message"><MessageSquare className="w-3 h-3 text-cyan-500" /></span>}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(reminder.id)}
                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition shrink-0 opacity-80 group-hover:opacity-100 cursor-pointer"
                title="Delete Reminder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </StaggerGrid>
      )}

      {/* New Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateReminder}
            className="rounded-3xl p-6 max-w-md w-full shadow-2xl bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Create Reminder</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Set task, assignment or extra class deadline</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Mathematics Assignment Submission"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="extra_class">Extra Class</option>
                    <option value="exam">Exam / Test</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Subject (Optional)</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- General / None --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Due Time</label>
                  <input
                    type="time"
                    value={form.dueTime}
                    onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      className={clsx(
                        "py-2 rounded-xl text-xs font-bold capitalize transition border cursor-pointer",
                        form.priority === p
                          ? PRIORITY_BADGES[p]
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Channel Opt-In */}
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-amber-700 dark:text-amber-300">
                  Notify Me Via (Choose Channels):
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition">
                    <input
                      type="checkbox"
                      checked={form.notifyPush}
                      onChange={(e) => setForm({ ...form, notifyPush: e.target.checked })}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">Browser Push</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition">
                    <input
                      type="checkbox"
                      checked={form.notifyAlarm}
                      onChange={(e) => setForm({ ...form, notifyAlarm: e.target.checked })}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                    <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">Alarm Sound</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition">
                    <input
                      type="checkbox"
                      checked={form.notifyEmail}
                      onChange={(e) => setForm({ ...form, notifyEmail: e.target.checked })}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">Email Alert</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition">
                    <input
                      type="checkbox"
                      checked={form.notifyTelegram}
                      onChange={(e) => setForm({ ...form, notifyTelegram: e.target.checked })}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">Telegram</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Additional details, room location, or requirements..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 text-sm font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-md shadow-amber-500/20 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? "Saving..." : "Save Reminder"}
              </button>
            </div>
          </form>
        </div>
      )}
    </PageTransition>
  );
}
