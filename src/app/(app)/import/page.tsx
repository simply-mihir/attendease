"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/hooks/useApi";
import {
  Camera, Upload, Loader2, CheckCircle2, XCircle, Plus, Trash2,
  ArrowRight, ArrowLeft, Sparkles, BookOpen, Clock, MapPin,
} from "lucide-react";
import clsx from "clsx";

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

  // ── Step 1: Image handling ────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large. Max 5MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Strip data:image/...;base64, prefix
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
      setImageMime(file.type);
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
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <span className="text-gradient">Import Timetable</span>
        </h1>
        <p className="text-text-muted text-sm mt-1 ml-[52px]">
          Snap a photo of your timetable and auto-add all subjects
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all",
                step >= s
                  ? "bg-gradient-to-br from-cyan-500 to-blue-500 border-border-heavy text-white shadow-lg shadow-cyan-500/20"
                  : "border-border-heavy bg-surface-3 text-text-muted"
              )}
            >
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={clsx(
                  "w-12 h-1 rounded-full transition-all",
                  step > s ? "bg-cyan-500" : "bg-surface-3 border border-border-heavy"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-12 text-xs text-text-muted font-bold">
        <span className={clsx(step === 1 && "text-cyan-400")}>Upload</span>
        <span className={clsx(step === 2 && "text-cyan-400")}>Review</span>
        <span className={clsx(step === 3 && "text-cyan-400")}>Done</span>
      </div>

      {/* ────── Step 1: Upload ────── */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          {/* Dropzone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={clsx(
              "glass rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:border-cyan-500/50 hover:bg-surface-3/50",
              imagePreview ? "p-4" : "p-12"
            )}
          >
            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview}
                  alt="Timetable preview"
                  className="rounded-xl max-h-72 mx-auto object-contain border-2 border-border-heavy"
                />
                <p className="text-center text-xs text-text-muted font-bold">
                  Click to change image
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-text mb-1">
                  Upload your timetable
                </h3>
                <p className="text-text-muted text-sm mb-4">
                  Drop an image here, or click to browse
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-surface-3 text-text-secondary border-2 border-border-heavy">
                    📷 Photo
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-surface-3 text-text-secondary border-2 border-border-heavy">
                    📱 Screenshot
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-surface-3 text-text-secondary border-2 border-border-heavy">
                    🖼️ Scan
                  </span>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {error && (
            <div className="glass rounded-2xl p-4 border-red-500/30 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm font-bold text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={analyzeImage}
            disabled={!imageBase64 || analyzing}
            className="btn-gradient w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
            <div className="glass rounded-2xl p-6 text-center animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-3 animate-pulse-glow">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-text font-bold">AI is reading your timetable...</p>
              <p className="text-xs text-text-muted mt-1">
                This usually takes 5–10 seconds
              </p>
            </div>
          )}
        </div>
      )}

      {/* ────── Step 2: Review & Edit ────── */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary bar */}
          <div className="glass rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-text text-sm">
                  Found {subjects.length} subjects with {totalSlots} schedule
                  slots
                </p>
                <p className="text-xs text-text-muted">
                  Review and edit before importing
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-text-muted hover:text-text transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Re-upload
            </button>
          </div>

          {/* Subject cards */}
          {subjects.map((sub, si) => (
            <div
              key={si}
              className="glass rounded-2xl p-5 space-y-4"
              style={{ animation: `fade-in 0.3s ease-out ${0.05 * si}s both` }}
            >
              {/* Subject header */}
              <div className="flex items-start gap-3">
                <div
                  className="w-2 h-12 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: sub.colorHex }}
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) =>
                      updateSubject(si, { name: e.target.value })
                    }
                    placeholder="Subject name"
                    className="input-glass w-full py-2 rounded-xl text-sm font-bold"
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
                      className="input-glass py-1.5 rounded-xl text-xs"
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
                      className="input-glass py-1.5 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeSubject(si)}
                  className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition shrink-0"
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
                      "w-5 h-5 rounded-full transition-all border-2",
                      sub.colorHex === c
                        ? "border-white scale-125 shadow-lg"
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
                    className="flex items-center gap-2 p-2.5 bg-surface-3 rounded-xl border-2 border-border-heavy"
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
                      className="input-glass py-1.5 px-2 rounded-lg text-xs flex-1"
                    >
                      {DAY_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-text-muted" />
                      <input
                        type="time"
                        value={sch.startTime}
                        onChange={(e) =>
                          updateSchedule(si, sci, {
                            startTime: e.target.value,
                          })
                        }
                        className="input-glass py-1 px-1.5 rounded-lg text-xs w-[90px]"
                      />
                      <span className="text-text-muted text-xs">–</span>
                      <input
                        type="time"
                        value={sch.endTime}
                        onChange={(e) =>
                          updateSchedule(si, sci, {
                            endTime: e.target.value,
                          })
                        }
                        className="input-glass py-1 px-1.5 rounded-lg text-xs w-[90px]"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-text-muted" />
                      <input
                        type="text"
                        value={sch.room || ""}
                        onChange={(e) =>
                          updateSchedule(si, sci, {
                            room: e.target.value || null,
                          })
                        }
                        placeholder="Room"
                        className="input-glass py-1 px-1.5 rounded-lg text-xs w-20"
                      />
                    </div>
                    <button
                      onClick={() => removeSchedule(si, sci)}
                      className="p-1 text-text-muted hover:text-red-400 transition"
                      title="Remove slot"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addSchedule(si)}
                  className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text transition px-2 py-1"
                >
                  <Plus className="w-3 h-3" /> Add time slot
                </button>
              </div>
            </div>
          ))}

          {/* Add subject manually */}
          <button
            onClick={addSubject}
            className="glass rounded-2xl p-4 w-full flex items-center justify-center gap-2 text-sm font-bold text-text-secondary hover:text-text hover:bg-surface-3 transition border-2 border-dashed border-border-heavy"
          >
            <Plus className="w-4 h-4" /> Add Subject Manually
          </button>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={
              importing || subjects.length === 0 || subjects.every((s) => !s.name.trim())
            }
            className="btn-gradient w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40"
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
        <div className="animate-fade-in">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/20 animate-pulse-glow">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-text mb-2">
              Import Complete! 🎉
            </h2>
            <p className="text-text-secondary mb-6">
              <span className="font-bold text-green-400">
                {importResult.succeeded} subjects
              </span>{" "}
              and{" "}
              <span className="font-bold text-cyan-400">
                {importResult.totalSlots} schedule slots
              </span>{" "}
              imported successfully
            </p>

            {importResult.failed > 0 && (
              <div className="glass rounded-xl p-3 mb-6 border-yellow-500/30 inline-block">
                <p className="text-xs text-yellow-400 font-bold">
                  ⚠ {importResult.failed} subjects could not be imported
                  (possibly duplicates or empty names)
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard"
                className="btn-gradient px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> Go to Dashboard
              </Link>
              <Link
                href="/subjects"
                className="btn-ghost px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2"
              >
                View Subjects
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
