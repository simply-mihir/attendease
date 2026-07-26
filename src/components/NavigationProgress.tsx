"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Navigation happened — start bar, then quickly complete
      prevPathname.current = pathname;

      // Clear previous timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);

      setProgress(30);
      setVisible(true);

      // Animate progress incrementally
      timerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 90;
          }
          return p + Math.random() * 15;
        });
      }, 100);

      // Complete after a short delay (page has already rendered by now)
      completeTimerRef.current = setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 300);
      }, 350);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, [pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}
    >
      <div
        className="h-full rounded-r-full"
        style={{
          width: `${progress}%`,
          transition: "width 0.2s ease-out",
          background: "linear-gradient(90deg, #6366F1, #06B6D4, #EC4899)",
          boxShadow: "0 0 12px rgba(99, 102, 241, 0.6), 0 0 4px rgba(6, 182, 212, 0.4)",
        }}
      />
    </div>
  );
}
