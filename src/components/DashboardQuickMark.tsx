"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Timer, Ban, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useSWRConfig } from "swr";

interface SubjectSummary {
  id: string;
  name: string;
  colorHex: string;
}

export function DashboardQuickMark({ subjects }: { subjects: SubjectSummary[] }) {
  const { mutate } = useSWRConfig();
  const [markSubjectId, setMarkSubjectId] = useState("");
  const [markDate, setMarkDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [markScheduleId, setMarkScheduleId] = useState("");
  const [markStatus, setMarkStatus] = useState("present");
  const [marking, setMarking] = useState(false);
  const [markSuccess, setMarkSuccess] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<{ id: string; label: string; time: string; weight?: number }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!markSubjectId || !markDate) {
      setAvailableSlots([]);
      setMarkScheduleId("");
      return;
    }

    let isMounted = true;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await fetch(`/api/v1/attendance/slots?subjectId=${markSubjectId}&date=${markDate}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAvailableSlots(data.slots || []);
            setMarkScheduleId("");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };
    fetchSlots();
    return () => { isMounted = false; };
  }, [markSubjectId, markDate]);

  async function handleMark() {
    if (!markSubjectId) {
      alert("Please select a subject.");
      return;
    }
    if (availableSlots.length === 0) {
      alert("No class found to mark attendance for this date.");
      return;
    }
    if (availableSlots.length > 0 && !markScheduleId) {
      alert("Please select a specific slot to mark attendance for.");
      return;
    }

    setMarking(true);
    setMarkSuccess(false);
    try {
      const slot = availableSlots.find(s => s.id === markScheduleId);
      const isExtra = slot?.label.startsWith("Extra:");
      const weight = slot?.weight || 1;

      const finalScheduleId = markScheduleId || undefined;
      const res = await fetch("/api/v1/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subjectId: markSubjectId, 
          date: markDate, 
          status: markStatus,
          scheduleId: isExtra ? undefined : finalScheduleId,
          source: isExtra ? "extra_class" : "manual",
          weight: weight
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to mark attendance.");
        return;
      }

      // Invalidate relevant SWR keys
      await mutate(
        (key) => typeof key === "string" && (key.startsWith("/api/v1/dashboard") || key.startsWith("/api/v1/subjects")),
        undefined,
        { revalidate: true }
      );

      setMarkSuccess(true);
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      setTimeout(() => setMarkSuccess(false), 1800);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setMarking(false); 
    }
  }

  return (
    <div
      className="relative overflow-hidden p-6 sm:p-7 mt-8 rounded-2xl bg-gradient-to-br from-emerald-500/90 to-teal-600/90 backdrop-blur-xl border border-white/20 shadow-xl"
      style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 150ms forwards" }}
    >
      <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay"></div>
      <div className="flex items-center gap-3 mb-5 relative z-10">
        <div className="w-10 h-10 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white shadow-sm backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-lg text-white drop-shadow-sm">Quick Mark Attendance</h3>
          <p className="text-xs font-semibold text-white/80">Record your status for any subject's session</p>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
        <div className="flex-1 w-full lg:min-w-[140px]">
          <label className="block text-xs font-bold text-white/90 drop-shadow-sm mb-1.5">Subject</label>
          <select
            value={markSubjectId}
            onChange={(e) => setMarkSubjectId(e.target.value)}
            className="input-3d w-full text-sm font-semibold"
          >
            <option value="">Select subject...</option>
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 w-full lg:min-w-[140px]">
          <label className="block text-xs font-bold text-white/90 drop-shadow-sm mb-1.5">Date</label>
          <input
            type="date"
            value={markDate}
            onChange={(e) => setMarkDate(e.target.value)}
            className="input-3d w-full text-sm font-semibold"
          />
        </div>
        {markSubjectId && (
          <div className="flex-1 w-full lg:min-w-[140px]">
            <label className="block text-xs font-bold text-white/90 drop-shadow-sm mb-1.5">Slot</label>
            <select
              value={markScheduleId}
              onChange={(e) => setMarkScheduleId(e.target.value)}
              disabled={loadingSlots || availableSlots.length === 0}
              className="input-3d w-full text-sm font-semibold"
            >
              {loadingSlots ? (
                <option value="">Loading slots...</option>
              ) : availableSlots.length === 0 ? (
                <option value="">No slots found</option>
              ) : (
                <>
                  <option value="">Select a slot...</option>
                  {availableSlots.map(slot => (
                    <option key={slot.id} value={slot.id}>{slot.label}</option>
                  ))}
                </>
              )}
            </select>
          </div>
        )}
        <div className="flex-1 w-full lg:min-w-[140px]">
          <label className="block text-xs font-bold text-white/90 drop-shadow-sm mb-1.5">Status</label>
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
          disabled={marking || !markSubjectId}
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
  );
}
