"use client";

import { useState } from "react";
import { Target, ListChecks, Check, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/hooks/useApi";

export function GoalSetupPopup({ onHide }: { onHide: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleHideForever() {
    setLoading(true);
    try {
      await apiFetch("/settings/notifications", {
        method: "PUT",
        body: JSON.stringify({ goalSetupComplete: true }),
      });
      onHide();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleNavigate() {
    router.push("/settings/goal");
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="rounded-3xl border-2 p-6 sm:p-8 max-w-lg w-full bg-white border-gray-200 shadow-[0_8px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_8px_0_0_#0d0d1a] transition-all relative overflow-hidden" style={{ animation: "fadeSlideUp 0.4s ease-out forwards" }}>
        {/* Background blobs for pop-art feel */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FF2D78]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#4cc9f0]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-3 mb-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#9b5de5]/20 border-2 border-[#9b5de5]/30 flex items-center justify-center shadow-sm">
            <Target className="w-8 h-8 text-[#9b5de5]" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#1a1a2e] dark:text-white mt-2">Set Your Goals!</h2>
          <p className="text-sm font-medium text-[#4a4a5a] dark:text-[#6b6b80] max-w-sm">
            We've upgraded Goal Mode! You can now choose between setting one overarching target, or unique individual targets for every single subject.
          </p>
        </div>

        <div className="grid gap-4 mb-8 relative z-10">
          {/* Overall Goal Option */}
          <button onClick={handleNavigate} className="group flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer bg-white border-gray-200 shadow-[0_4px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#1a1a2e] dark:shadow-[0_4px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a]">
            <div className="w-12 h-12 rounded-xl bg-[#4cc9f0]/15 text-[#4cc9f0] flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-sm text-[#1a1a2e] dark:text-white">Overall Goal</h3>
              <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80] mt-0.5">Set a single target (e.g. 75%) for all classes</p>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-transparent group-hover:border-[#4cc9f0] group-hover:bg-[#4cc9f0]/10 transition-colors">
              <Check className="w-3.5 h-3.5 text-[#4cc9f0] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Subject-wise Goal Option */}
          <button onClick={handleNavigate} className="group flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer bg-white border-gray-200 shadow-[0_4px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#1a1a2e] dark:shadow-[0_4px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a]">
            <div className="w-12 h-12 rounded-xl bg-[#06d6a0]/15 text-[#06d6a0] flex items-center justify-center shrink-0">
              <ListChecks className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-sm text-[#1a1a2e] dark:text-white">Subject-wise Goals</h3>
              <p className="text-xs text-[#9ca3af] dark:text-[#6b6b80] mt-0.5">Customize specific targets for each subject</p>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-transparent group-hover:border-[#06d6a0] group-hover:bg-[#06d6a0]/10 transition-colors">
              <Check className="w-3.5 h-3.5 text-[#06d6a0] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>

        <div className="flex justify-center relative z-10">
          <button 
            onClick={handleHideForever} 
            disabled={loading}
            className="flex items-center gap-2 text-xs font-bold text-[#ef476f] hover:text-[#d63b5f] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <EyeOff className="w-4 h-4" />
            {loading ? "Hiding..." : "Hide forever without setting goals"}
          </button>
        </div>
      </div>
    </div>
  );
}
