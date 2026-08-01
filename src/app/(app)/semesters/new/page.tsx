"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/hooks/useApi";
import { GraduationCap, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NewSemesterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiFetch("/semesters", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      router.push("/semesters");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create semester");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/semesters" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-gradient">Start New Semester</span>
          </h1>
          <p className="text-text-muted text-sm mt-1 ml-[52px]">
            This will archive your current semester.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-text">Semester Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Fall 2024, Semester 5"
              className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-text">Start Date</label>
              <input
                type="date"
                required
                className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-text">End Date</label>
              <input
                type="date"
                required
                className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
          <Link href="/semesters" className="px-6 py-3 rounded-xl font-semibold text-text hover:bg-white/5 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Semester"}
          </button>
        </div>
      </form>
    </div>
  );
}
