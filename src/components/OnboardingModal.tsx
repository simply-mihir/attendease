"use client";
import { useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { useProfiles } from "./ProfileContext";
import { GraduationCap, Building2, BookOpen, Calendar, Sparkles, Loader2, UserCheck } from "lucide-react";

export function OnboardingModal() {
  const { profiles, loading, reloadProfiles } = useProfiles();
  const [submitting, setSubmitting] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [institution, setInstitution] = useState("");
  const [courseName, setCourseName] = useState("");
  const [semesterName, setSemesterName] = useState("Semester 1");

  const needsOnboarding = !loading && profiles.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileName.trim() || !courseName.trim() || !institution.trim()) return;
    setSubmitting(true);

    try {
      await apiFetch("/profiles", {
        method: "POST",
        body: JSON.stringify({
          name: profileName,
          degreeType: courseName,
          institution,
          semesterName: semesterName || "Semester 1",
          isCurrent: true,
        }),
      });
      await reloadProfiles();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (!needsOnboarding) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "onboard-in 0.4s ease-out forwards",
      }}
    >
      <style>{`
        @keyframes onboard-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-up {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        className="glass-strong rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-purple-500/30"
        style={{ animation: "modal-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30 animate-pulse-glow">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Academic Profile Setup
          </div>
          <h2 className="text-2xl font-bold text-gradient">Create Your Degree Profile</h2>
          <p className="text-xs text-text-secondary">
            Please enter your academic details to configure your attendance workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              Profile Name
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. Primary Degree, B.Tech CS Profile, Dual Degree"
              required
              className="input-glass w-full px-4 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-pink-400" />
              College / University Name
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. IIT Bombay, Delhi University, Stanford"
              required
              className="input-glass w-full px-4 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              Course Pursuing
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. B.Tech Computer Science, B.Com (Hons), M.Sc Data Science"
              required
              className="input-glass w-full px-4 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Current Semester
            </label>
            <select
              value={semesterName}
              onChange={(e) => setSemesterName(e.target.value)}
              className="input-glass w-full px-4 py-2.5 rounded-xl text-sm"
            >
              {["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8", "Semester 9", "Semester 10"].map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-gradient w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-purple-500/25"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
