"use client";
import { useState, useRef, useCallback } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import Link from "next/link";
import { apiFetch } from "@/hooks/useApi";
import {
  Camera, Upload, Loader2, CheckCircle2, XCircle, Plus, Trash2,
  ArrowRight, ArrowLeft, Sparkles, BookOpen, Clock, MapPin, FileSpreadsheet,
} from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";

// ─── Types ──────────────────────────────────────────────────────
interface ParsedSchedule {
  day: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
}

interface ParsedSubject {
  name: string;
  code: string | null;
  instructor: string | null;
  colorHex: string;
  schedules: ParsedSchedule[];
}

const DAY_OPTIONS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

const COLORS = [
  "#7C3AED", "#06B6D4", "#EC4899", "#F59E0B", "#22C55E",
  "#EF4444", "#8B5CF6", "#14B8A6", "#F97316", "#6366F1",
  "#A855F7", "#0EA5E9", "#E11D48", "#84CC16", "#D946EF",
];

// ─── Main Component ─────────────────────────────────────────────
export default function ImportPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const [fileName, setFileName] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<ParsedSubject[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState<{
    succeeded: number;
    failed: number;
    totalSlots: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = new Set([
    "image/png", "image/jpeg", "image/webp", "image/gif",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv",
  ]);

  // ── Step 1: File handling ──────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    // Allow matching by extension as fallback (some browsers return empty type for CSV)
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isAccepted = ACCEPTED_TYPES.has(file.type) ||
      ["csv", "xlsx", "xls", "pdf", "png", "jpg", "jpeg", "webp", "gif"].includes(ext || "");

    if (!isAccepted) {
      setError("Unsupported file type. Use an image, PDF, Excel, or CSV file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB.");
      return;
    }
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Only show image preview for image types
      if (file.type.startsWith("image/")) {
        setImagePreview(dataUrl);
      } else {
        setImagePreview(null); // Non-image files get a file-name based preview
      }
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
      // Map extension to mime if browser didn't provide one
      let mime = file.type;
      if (!mime || mime === "application/octet-stream") {
        if (ext === "csv") mime = "text/csv";
        else if (ext === "xlsx") mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        else if (ext === "xls") mime = "application/vnd.ms-excel";
        else if (ext === "pdf") mime = "application/pdf";
      }
      setImageMime(mime);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  async function analyzeImage() {
    if (!imageBase64) return;
    setAnalyzing(true);
    setError("");
    try {
      const res = await apiFetch("/timetable/parse", {
        method: "POST",
        body: JSON.stringify({ image: imageBase64, mimeType: imageMime }),
      });
      if (res.error && (!res.subjects || res.subjects.length === 0)) {
        setError(res.error);
        return;
      }
      setSubjects(res.subjects || []);
      setStep(2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to analyze image";
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  }

  // ── Step 2: Edit helpers ──────────────────────────────────────
  function updateSubject(idx: number, patch: Partial<ParsedSubject>) {
    setSubjects((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  }

  function updateSchedule(
    subIdx: number,
    schIdx: number,
    patch: Partial<ParsedSchedule>
  ) {
    setSubjects((prev) =>
      prev.map((s, i) =>
        i === subIdx
          ? {
              ...s,
              schedules: s.schedules.map((sch, j) =>
                j === schIdx ? { ...sch, ...patch } : sch
              ),
            }
          : s
      )
    );
  }

  function removeSubject(idx: number) {
    setSubjects((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeSchedule(subIdx: number, schIdx: number) {
    setSubjects((prev) =>
      prev.map((s, i) =>
        i === subIdx
          ? { ...s, schedules: s.schedules.filter((_, j) => j !== schIdx) }
          : s
      )
    );
  }

  function addSchedule(subIdx: number) {
    setSubjects((prev) =>
      prev.map((s, i) =>
        i === subIdx
          ? {
              ...s,
              schedules: [
                ...s.schedules,
                {
                  day: "Monday",
                  dayOfWeek: 1,
                  startTime: "09:00",
                  endTime: "10:00",
                  room: null,
                },
              ],
            }
          : s
      )
    );
  }

  function addSubject() {
    setSubjects((prev) => [
      ...prev,
      {
        name: "",
        code: null,
        instructor: null,
        colorHex: COLORS[prev.length % COLORS.length],
        schedules: [
          {
            day: "Monday",
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "10:00",
            room: null,
          },
        ],
      },
    ]);
  }

  // ── Step 3: Import ────────────────────────────────────────────
  async function handleImport() {
    setImporting(true);
    setError("");
    let succeeded = 0;
    let failed = 0;
    let totalSlots = 0;

    for (let i = 0; i < subjects.length; i++) {
      const sub = subjects[i];
      if (!sub.name.trim()) {
        failed++;
        continue;
      }

      setImportProgress(`Importing subject ${i + 1} of ${subjects.length}: ${sub.name}...`);

      try {
        // Create subject
        const subRes = await apiFetch("/subjects", {
          method: "POST",
          body: JSON.stringify({
            name: sub.name.trim(),
            code: sub.code || undefined,
            instructorName: sub.instructor || undefined,
            colorHex: sub.colorHex,
          }),
        });

        const subjectId = subRes.subject?.id;
        if (!subjectId) {
          failed++;
          continue;
        }

        // Create schedules
        for (const sch of sub.schedules) {
          try {
            await apiFetch("/schedules", {
              method: "POST",
              body: JSON.stringify({
                subjectId,
                dayOfWeek: sch.dayOfWeek,
                startTime: sch.startTime,
                endTime: sch.endTime,
                room: sch.room || undefined,
              }),
            });
            totalSlots++;
          } catch {
            // Schedule creation failed, continue with others
          }
        }

        succeeded++;
      } catch {
        failed++;
      }
    }

    setImportResult({ succeeded, failed, totalSlots });
    setStep(3);
    setImporting(false);
  }

  const totalSlots = subjects.reduce((a, s) => a + s.schedules.length, 0);

  // ─── Render ───────────────────────────────────────────────────
  return (
    <PageTransition direction="right" staggerChildren={false} className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div style={{ opacity: 0, animation: "fadeSlideRight 0.5s ease-out 0ms forwards" }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Camera className="w-5 h-5 text-white" />
          </div>
          Import Timetable
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-[52px]">
          Upload a photo, PDF, or spreadsheet of your timetable to auto-add all subjects
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-all",
                step >= s
                  ? "bg-gradient-to-br from-cyan-500 to-blue-500 border-cyan-400 text-white shadow-md shadow-cyan-500/20"
                  : "border-gray-200 bg-gray-100 text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-500"
              )}
            >
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={clsx(
                  "w-12 h-1 rounded-full transition-all",
                  step > s ? "bg-cyan-500" : "bg-gray-200 dark:bg-white/10"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-12 text-xs font-bold text-gray-400 dark:text-gray-500" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
        <span className={clsx(step === 1 && "text-cyan-600 dark:text-cyan-400")}>Upload</span>
        <span className={clsx(step === 2 && "text-cyan-600 dark:text-cyan-400")}>Review</span>
        <span className={clsx(step === 3 && "text-cyan-600 dark:text-cyan-400")}>Done</span>
      </div>

      {/* ────── Step 1: Upload ────── */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 150ms forwards" }}>
          {/* Dropzone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={clsx(
              "rounded-3xl border-2 border-dashed cursor-pointer transition-all bg-white border-gray-200 hover:border-cyan-500 hover:bg-cyan-50/20 dark:bg-white/[0.04] dark:border-white/10 dark:hover:border-cyan-500/50 dark:hover:bg-white/[0.06] shadow-sm",
              imagePreview ? "p-4" : "p-12"
            )}
          >
            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview}
                  alt="Timetable preview"
                  className="rounded-2xl max-h-72 mx-auto object-contain border border-gray-200 dark:border-white/10"
                />
                <p className="text-center text-xs font-bold text-gray-500 dark:text-gray-400">
                  Click to change file
                </p>
              </div>
            ) : imageBase64 && fileName ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <FileSpreadsheet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{fileName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ready to analyze</p>
                </div>
                <p className="text-center text-xs font-bold text-gray-500 dark:text-gray-400">
                  Click to change file
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Upload your timetable
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  Drop a file here, or click to browse
                </p>
                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10">
                    📷 Photo
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10">
                    📄 PDF
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10">
                    📊 Excel / CSV
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10">
                    📱 Screenshot
                  </span>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.xlsx,.xls,.csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {error && (
            <div className="rounded-2xl p-4 bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          )}

          <button
            onClick={analyzeImage}
            disabled={!imageBase64 || analyzing}
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing your timetable...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Timetable
              </>
            )}
          </button>

          {analyzing && (
            <FuturisticLoader variant="section" title="AI is reading your timetable..." Icon={Sparkles} />
          )}
        </div>
      )}

      {/* ────── Step 2: Review & Edit ────── */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 150ms forwards" }}>
          {/* Summary bar */}
          <div className="rounded-3xl p-4 sm:p-5 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-gray-900 dark:text-white text-sm">
                  Found {subjects.length} subjects with {totalSlots} schedule slots
                </p>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Review and edit before importing
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Re-upload
            </button>
          </div>

          {/* Subject cards */}
          {subjects.map((sub, si) => (
            <div
              key={si}
              className="rounded-3xl p-5 sm:p-6 bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl space-y-4 transition-all"
              style={{ animation: `fade-in 0.3s ease-out ${0.05 * si}s both` }}
            >
              {/* Subject header */}
              <div className="flex items-start gap-3">
                <div
                  className="w-2.5 h-12 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: sub.colorHex, boxShadow: `0 0 10px ${sub.colorHex}40` }}
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) =>
                      updateSubject(si, { name: e.target.value })
                    }
                    placeholder="Subject name"
                    className="w-full px-3.5 py-2 rounded-xl text-sm font-bold border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={sub.code || ""}
                      onChange={(e) =>
                        updateSubject(si, {
                          code: e.target.value || null,
                        })
                      }
                      placeholder="Code (optional)"
                      className="px-3 py-1.5 rounded-xl text-xs border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={sub.instructor || ""}
                      onChange={(e) =>
                        updateSubject(si, {
                          instructor: e.target.value || null,
                        })
                      }
                      placeholder="Instructor (optional)"
                      className="px-3 py-1.5 rounded-xl text-xs border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeSubject(si)}
                  className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition shrink-0 cursor-pointer"
                  title="Remove subject"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Color picker */}
              <div className="flex items-center gap-1.5 pl-5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateSubject(si, { colorHex: c })}
                    className={clsx(
                      "w-5 h-5 rounded-full transition-all border-2 cursor-pointer",
                      sub.colorHex === c
                        ? "border-gray-900 dark:border-white scale-125 shadow-md"
                        : "border-transparent hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Schedule slots */}
              <div className="space-y-2 pl-5">
                {sub.schedules.map((sch, sci) => (
                  <div
                    key={sci}
                    className="flex flex-wrap md:flex-nowrap items-center gap-2.5 p-3.5 bg-gray-50/80 dark:bg-white/[0.03] rounded-2xl border border-gray-200/60 dark:border-white/5"
                  >
                    <select
                      value={sch.dayOfWeek}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        const dayLabel =
                          DAY_OPTIONS.find((d) => d.value === val)?.label ||
                          "Monday";
                        updateSchedule(si, sci, {
                          dayOfWeek: val,
                          day: dayLabel,
                        });
                      }}
                      className="py-1.5 px-3 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white w-full md:w-auto min-w-[115px] focus:outline-none"
                    >
                      {DAY_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-black/30 px-2 py-1 rounded-xl border border-gray-200/60 dark:border-white/5 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <input
                        type="time"
                        value={sch.startTime}
                        onChange={(e) =>
                          updateSchedule(si, sci, {
                            startTime: e.target.value,
                          })
                        }
                        className="bg-transparent py-0.5 px-1.5 text-xs font-mono font-bold text-gray-900 dark:text-white w-[110px] focus:outline-none"
                      />
                      <span className="text-gray-400 text-xs font-bold">–</span>
                      <input
                        type="time"
                        value={sch.endTime}
                        onChange={(e) =>
                          updateSchedule(si, sci, {
                            endTime: e.target.value,
                          })
                        }
                        className="bg-transparent py-0.5 px-1.5 text-xs font-mono font-bold text-gray-900 dark:text-white w-[110px] focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 min-w-[160px] w-full md:w-auto">
                      <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0 ml-1" />
                      <input
                        type="text"
                        value={sch.room || ""}
                        onChange={(e) =>
                          updateSchedule(si, sci, {
                            room: e.target.value || null,
                          })
                        }
                        placeholder="Room / Venue"
                        className="py-1.5 px-3 rounded-xl text-xs border border-gray-200 bg-white text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white w-full focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => removeSchedule(si, sci)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition shrink-0 ml-auto md:ml-0 cursor-pointer"
                      title="Remove slot"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addSchedule(si)}
                  className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline transition px-2 py-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add time slot
                </button>
              </div>
            </div>
          ))}

          {/* Add subject manually */}
          <button
            onClick={addSubject}
            className="rounded-3xl p-4 w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-dashed border-gray-300 dark:bg-white/[0.04] dark:border-white/10 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/[0.06] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Subject Manually
          </button>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={
              importing || subjects.length === 0 || subjects.every((s) => !s.name.trim())
            }
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-40"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {importProgress}
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Import {subjects.length} Subjects & {totalSlots} Slots
              </>
            )}
          </button>
        </div>
      )}

      {/* ────── Step 3: Done ────── */}
      {step === 3 && importResult && (
        <div className="animate-fade-in" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 150ms forwards" }}>
          <div className="rounded-3xl p-8 sm:p-10 text-center bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-500/20 text-white">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
              Import Complete! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium">
              <span className="font-bold text-teal-600 dark:text-teal-400">
                {importResult.succeeded} subjects
              </span>{" "}
              and{" "}
              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                {importResult.totalSlots} schedule slots
              </span>{" "}
              imported successfully
            </p>

            {importResult.failed > 0 && (
              <div className="rounded-2xl p-3 mb-6 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 inline-block">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">
                  ⚠ {importResult.failed} subjects could not be imported
                  (possibly duplicates or empty names)
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-white inline-flex items-center gap-2 shadow-md shadow-teal-500/20 hover:shadow-lg transition"
              >
                <BookOpen className="w-4 h-4" /> Go to Dashboard
              </Link>
              <Link
                href="/subjects"
                className="px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 inline-flex items-center gap-2 transition"
              >
                View Subjects
              </Link>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
