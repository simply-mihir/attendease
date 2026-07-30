"use client";

import { useEffect, useState } from "react";

interface MarkingProgressBarProps {
  isActive: boolean;
  status: "PRESENT" | "ABSENT" | null;
  onComplete?: () => void;
}

export function MarkingProgressBar({ isActive, status, onComplete }: MarkingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }

    setVisible(true);
    setProgress(0);

    // Fast initial progress (0-70% in 300ms) — feels instant
    const t1 = setTimeout(() => setProgress(70), 50);
    // Slow middle (70-90% in 500ms) — waiting for server
    const t2 = setTimeout(() => setProgress(90), 400);
    // Complete (100%) — triggered when server responds
    const t3 = setTimeout(() => {
      setProgress(100);
      onComplete?.();
    }, 800);
    // Hide after completion
    const t4 = setTimeout(() => setVisible(false), 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isActive, onComplete]);

  if (!visible) return null;

  const barColor =
    status === "PRESENT"
      ? "from-green-400 via-emerald-400 to-cyan-400"
      : status === "ABSENT"
      ? "from-red-400 via-pink-400 to-rose-400"
      : "from-purple-400 via-violet-400 to-indigo-400";

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 pointer-events-none">
      <div
        className={`h-full bg-gradient-to-r ${barColor} shadow-lg transition-all duration-300 ease-out`}
        style={{
          width: `${progress}%`,
          boxShadow: status === "PRESENT"
            ? "0 0 15px rgba(34, 197, 94, 0.6)"
            : status === "ABSENT"
            ? "0 0 15px rgba(239, 68, 68, 0.6)"
            : "0 0 15px rgba(124, 58, 237, 0.6)",
        }}
      />
      {/* Glowing dot at the end of the bar */}
      {progress > 0 && progress < 100 && (
        <div
          className={`absolute top-0 h-1 w-8 bg-gradient-to-r ${barColor} blur-sm`}
          style={{ left: `${progress}%`, transform: "translateX(-100%)" }}
        />
      )}
    </div>
  );
}
