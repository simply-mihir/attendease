"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 border-2 border-rose-500/20 shadow-[0_6px_0_0_rgba(244,63,94,0.1)]">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-black text-text mb-3">Connection Lost</h2>
      <p className="text-base font-semibold text-text-muted max-w-md mb-8">
        We couldn't connect to the database. This usually happens if your database credentials are invalid, expired, or the database server is paused.
      </p>
      <button
        onClick={() => {
          // Attempt to recover by trying to re-render the segment
          reset();
          window.location.reload();
        }}
        className="btn-3d-primary px-8 py-3 flex items-center gap-2 cursor-pointer font-bold"
      >
        <RefreshCcw className="w-5 h-5" /> Try Again
      </button>
    </div>
  );
}
