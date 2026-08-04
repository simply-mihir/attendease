"use client";

import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
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
  high: "bg-[#ef476f]/15 text-[#ef476f] border-2 border-[#ef476f]/40 shadow-[0_2px_0_0_#ef476f]",
  medium: "bg-[#ff6b35]/15 text-[#ff6b35] border-2 border-[#ff6b35]/40 shadow-[0_2px_0_0_#ff6b35]",
  low: "bg-[#00f5d4]/15 text-[#00b4d8] dark:text-[#00f5d4] border-2 border-[#00f5d4]/40 shadow-[0_2px_0_0_#00b4d8]",
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
    <>
      <PageTransition direction="right" staggerChildren={false} className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header */}
      <div className="flex items-center justify-between mb-6" style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff6b35]/10">
            <Bell className="h-6 w-6 text-[#ff6b35]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1a1a2e] dark:text-white">Reminders & Tasks</h1>
            <p className="text-sm text-[#9ca3af] dark:text-[#6b6b80]">Keep track of extra classes, assignments, exams & deadlines</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl border-2 border-[#cc1a5e] bg-[#FF2D78] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_0_#cc1a5e] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#cc1a5e] active:translate-y-[3px] active:shadow-none dark:border-[#b81e56] dark:shadow-[0_4px_0_0_#b81e56] dark:hover:shadow-[0_2px_0_0_#b81e56] transition-all duration-150 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Reminder
        </button>
      </div>

      {/* Filter Tabs & Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  active
                    ? "border-[#cc1a5e] bg-[#FF2D78] text-white shadow-[0_3px_0_0_#cc1a5e] dark:border-[#b81e56] dark:shadow-[0_3px_0_0_#b81e56]"
                    : "border-[#06b6d4]/50 bg-[#06b6d4]/10 text-[#06b6d4] shadow-[0_3px_0_0_rgba(6,182,212,0.3)] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_rgba(6,182,212,0.3)] dark:border-[#06b6d4]/30 dark:bg-[#06b6d4]/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-150 flex items-center gap-2 ml-auto cursor-pointer border-[#06b6d4]/50 bg-[#06b6d4]/10 text-[#06b6d4] shadow-[0_3px_0_0_rgba(6,182,212,0.3)] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_rgba(6,182,212,0.3)] dark:border-[#06b6d4]/30 dark:bg-[#06b6d4]/5"
        >
          <Check className="w-4 h-4 text-[#06d6a0]" />
          {showCompleted ? "Hide Completed" : "Show Completed"}
        </button>
      </div>

      {/* Reminders List */}
      {isLoading ? (
        <div className="py-16">
          <FuturisticLoader variant="section" title="Loading Reminders..." Icon={Bell} />
        </div>
      ) : filteredReminders.length === 0 ? (
        <div 
          className="group relative rounded-2xl border-2 p-12 text-center transition-all duration-300 overflow-hidden" 
          style={{ 
            opacity: 0, 
            animation: "fadeSlideUp 0.5s ease-out 100ms forwards",
            borderColor: "#ff6b3580",
            backgroundColor: "#ff6b3520",
            boxShadow: "0 6px 0 0 #ff6b3560"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 4px 0 0 #ff6b3560`;
            e.currentTarget.style.transform = `translateY(2px)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `0 6px 0 0 #ff6b3560`;
            e.currentTarget.style.transform = '';
          }}
        >
          {/* Shimmer */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, #ff6b351A 0%, #ff6b3530 50%, #ff6b351A 100%)`,
              backgroundSize: "200% 200%",
              animation: "subjectCardShimmer 3s ease-in-out infinite",
            }} />

          {/* Top accent line */}
          <div className="absolute inset-x-0 top-0 h-[3px] pointer-events-none"
            style={{ background: `linear-gradient(to right, transparent, #ff6b3599, transparent)` }} />
            
          <div className="relative z-10">
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-3xl bg-[#ff6b35] border-2 border-[#cc5529] shadow-[0_6px_0_0_#cc5529] flex items-center justify-center transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                <Bell className="w-10 h-10 text-white drop-shadow-md" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-text mb-3 tracking-tight">No Reminders Found</h3>
            <p className="text-text-muted font-bold mb-8 max-w-md mx-auto text-sm leading-relaxed">
              You don't have any pending reminders. Click below to add one!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-xl border-2 border-[#cc1a5e] bg-[#FF2D78] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_0_#cc1a5e] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#cc1a5e] active:translate-y-[3px] active:shadow-none dark:border-[#b81e56] dark:shadow-[0_4px_0_0_#b81e56] dark:hover:shadow-[0_2px_0_0_#b81e56] transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Reminder
            </button>
          </div>
        </div>
      ) : (
        <StaggerGrid className="space-y-4" delay={100} staggerDelay={50} animation="fadeSlideUp">
          {filteredReminders.map((reminder) => {
            const color = reminder.subject?.colorHex || "#ff6b35"; // Orange fallback
            return (
              <div
                key={reminder.id}
                className={`group relative rounded-2xl border-2 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-150 overflow-hidden cursor-pointer ${
                  reminder.isCompleted ? "opacity-60 grayscale-[50%]" : ""
                }`}
                style={{
                  borderColor: `${color}40`,
                  backgroundColor: `${color}0D`,
                  boxShadow: `0 6px 0 0 ${color}30`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 4px 0 0 ${color}30`;
                  e.currentTarget.style.transform = `translateY(2px)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 6px 0 0 ${color}30`;
                  e.currentTarget.style.transform = '';
                }}
              >
                {/* Shimmer */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${color}08 0%, ${color}15 50%, ${color}08 100%)`,
                    backgroundSize: "200% 200%",
                    animation: "subjectCardShimmer 3s ease-in-out infinite",
                  }} />

                {/* Top accent line */}
                <div className="absolute inset-x-0 top-0 h-[2px] pointer-events-none"
                  style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }} />

                <div className="relative z-10 flex flex-col md:flex-row gap-4 items-start md:items-center flex-1 min-w-0">
                  {/* Left Checkbox Icon Block */}
                  <button
                    onClick={(e) => { e.preventDefault(); handleToggleComplete(reminder); }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 cursor-pointer shadow-sm"
                    style={{ backgroundColor: reminder.isCompleted ? "#06d6a020" : `${color}1A`, color: reminder.isCompleted ? "#06d6a0" : color }}
                  >
                    {reminder.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                  
                  {/* Middle Info Block */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-extrabold text-xl text-[#1a1a2e] dark:text-white truncate pr-2">
                        {reminder.title}
                      </h3>
                      {reminder.subject && (
                         <span className="rounded-lg border-2 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase"
                           style={{ borderColor: `${color}40`, backgroundColor: `${color}20`, color: color }}>
                           {reminder.subject.name}
                         </span>
                       )}
                       <span className={clsx("rounded-lg border-2 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase", PRIORITY_BADGES[reminder.priority])}>
                         {reminder.priority}
                       </span>
                    </div>
                    
                    {/* Time & Description line */}
                    <div className="text-sm font-semibold text-[#9ca3af] dark:text-[#6b6b80] mb-3 md:mb-2 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(reminder.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {reminder.dueTime && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {reminder.dueTime}
                        </span>
                      )}
                      {reminder.description && (
                        <>
                          <span className="hidden md:inline text-gray-300 dark:text-gray-700">•</span>
                          <span className="line-clamp-1">{reminder.description}</span>
                        </>
                      )}
                    </div>

                    {/* Chips bottom line */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 text-[#4a4a5a] dark:text-[#c4c4d4]">
                        {reminder.category.replace("_", " ")}
                      </span>
                      
                      {/* Active Channels Icons */}
                      {(reminder.notifyPush || reminder.notifyAlarm || reminder.notifyEmail || reminder.notifyTelegram) && (
                        <div className="flex items-center gap-1.5 ml-1 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-[#4a4a5a] dark:text-[#c4c4d4]">
                          <span className="text-[10px] font-bold tracking-wider uppercase opacity-70 pr-1 border-r border-gray-300 dark:border-gray-700">Channels</span>
                          {reminder.notifyPush && <Bell className="w-3 h-3 text-[#ff6b35]" />}
                          {reminder.notifyAlarm && <Volume2 className="w-3 h-3 text-[#ff6b35]" />}
                          {reminder.notifyEmail && <Mail className="w-3 h-3 text-[#00b4d8]" />}
                          {reminder.notifyTelegram && <MessageSquare className="w-3 h-3 text-[#06d6a0]" />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right Action (Delete) */}
                <div className="relative z-10 shrink-0 flex items-center mt-2 md:mt-0">
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(reminder.id); }}
                    className="rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] group-hover:translate-y-[2px] group-hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] cursor-pointer bg-[#ef476f]/10 border-[#ef476f]/40 text-[#ef476f]"
                  >
                    Delete <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </StaggerGrid>
      )}

      </PageTransition>

      {/* New Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form
            onSubmit={handleCreateReminder}
            className="card-3d p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-[#ff6b35] border-2 border-[#d95220] flex items-center justify-center shadow-[0_3px_0_0_#d95220] shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-text">Create Reminder</h3>
                <p className="text-xs font-bold text-text-muted">Set task, assignment or extra class deadline</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-text mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Mathematics Assignment Submission"
                  required
                  className="input-3d"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-text mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-3d"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="extra_class">Extra Class</option>
                    <option value="exam">Exam / Test</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-text mb-1">Subject (Optional)</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="input-3d"
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
                  <label className="block text-xs font-black text-text mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    required
                    className="input-3d"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-text mb-1">Due Time</label>
                  <input
                    type="time"
                    value={form.dueTime}
                    onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                    className="input-3d font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-text mb-1">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      className={clsx(
                        "py-2 rounded-xl text-xs font-black capitalize transition border-2 cursor-pointer",
                        form.priority === p
                          ? PRIORITY_BADGES[p]
                          : "btn-3d-secondary"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Channel Opt-In */}
              <div className="p-3.5 bg-[#ff6b35]/10 border-2 border-[#ff6b35]/30 rounded-2xl space-y-2">
                <label className="block text-xs font-black text-[#ff6b35]">
                  Notify Me Via (Choose Channels):
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-[#141425] border-2 border-gray-200 dark:border-[#2a2a3d] hover:border-gray-400 transition">
                    <input
                      type="checkbox"
                      checked={form.notifyPush}
                      onChange={(e) => setForm({ ...form, notifyPush: e.target.checked })}
                      className="rounded accent-[#ff6b35] cursor-pointer"
                    />
                    <Bell className="w-3.5 h-3.5 text-[#ff6b35]" />
                    <span className="font-bold text-text">Browser Push</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-[#141425] border-2 border-gray-200 dark:border-[#2a2a3d] hover:border-gray-400 transition">
                    <input
                      type="checkbox"
                      checked={form.notifyAlarm}
                      onChange={(e) => setForm({ ...form, notifyAlarm: e.target.checked })}
                      className="rounded accent-[#ff6b35] cursor-pointer"
                    />
                    <Volume2 className="w-3.5 h-3.5 text-[#ff6b35]" />
                    <span className="font-bold text-text">Alarm Sound</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-[#141425] border-2 border-gray-200 dark:border-[#2a2a3d] hover:border-gray-400 transition">
                    <input
                      type="checkbox"
                      checked={form.notifyEmail}
                      onChange={(e) => setForm({ ...form, notifyEmail: e.target.checked })}
                      className="rounded accent-[#ff6b35] cursor-pointer"
                    />
                    <Mail className="w-3.5 h-3.5 text-[#00b4d8]" />
                    <span className="font-bold text-text">Email Alert</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-[#141425] border-2 border-gray-200 dark:border-[#2a2a3d] hover:border-gray-400 transition">
                    <input
                      type="checkbox"
                      checked={form.notifyTelegram}
                      onChange={(e) => setForm({ ...form, notifyTelegram: e.target.checked })}
                      className="rounded accent-[#ff6b35] cursor-pointer"
                    />
                    <MessageSquare className="w-3.5 h-3.5 text-[#06d6a0]" />
                    <span className="font-bold text-text">Telegram</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-text mb-1">Description (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Additional details, room location, or requirements..."
                  rows={2}
                  className="input-3d"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-3d-secondary flex-1 py-2.5 font-black text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-3d-primary flex-1 py-2.5 font-black text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? "Saving..." : "Save Reminder"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
