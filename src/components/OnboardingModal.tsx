"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/hooks/useApi";
import { GraduationCap, Building2, BookOpen, Calendar, Sparkles, Loader2 } from "lucide-react";

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [institution, setInstitution] = useState("");
  const [courseName, setCourseName] = useState("");
  const [semesterName, setSemesterName] = useState("Semester 1");

  useEffect(() => {
    async function checkProfiles() {
      try {
        const res = await apiFetch("/profiles");
        if (!res.profiles || res.profiles.length === 0) {
          setShow(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    checkProfiles();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseName.trim() || !institution.trim()) return;
    setSubmitting(true);

    try {
      await apiFetch("/profiles", {
        method: "POST",
        body: JSON.stringify({
          name: courseName,
          degreeType: courseName,
          institution,
          semesterName: semesterName || "Semester 1",
          isCurrent: true,
        }),
      });
      setShow(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-purple-500/30">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30 animate-pulse-glow">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Complete Your Profile Setup
          </div>
          <h2 className="text-2xl font-bold text-gradient">Welcome to AttendEase!</h2>
          <p className="text-xs text-text-secondary">
            Please complete your academic profile to start tracking your attendance accurately.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              College / University Name
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. IIT Delhi, Delhi University, Stanford"
              required
              className="input-glass w-full px-4 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              Course / Degree Name
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. B.Tech Computer Science, B.Com (Hons), M.Sc"
              required
              className="input-glass w-full px-4 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Current Semester / Term
            </label>
            <select
              value={semesterName}
              onChange={(e) => setSemesterName(e.target.value)}
              className="input-glass w-full px-4 py-2.5 rounded-xl text-sm"
            >
              {["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8", "Fall 2026", "Spring 2026"].map((sem) => (
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
