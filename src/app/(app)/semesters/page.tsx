"use client";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import Link from "next/link";
import { GraduationCap, Calendar, BookOpen, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

interface SemesterSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  _count: { subjects: number; holidays: number; examPeriods: number };
}

export default function SemestersPage() {
  const { data: semesters, isLoading } = useSWRFetch<SemesterSummary[]>("/semesters");

  if (isLoading) {
    return <FuturisticLoader variant="section" title="Loading semesters" icon="🎓" />;
  }

  return (
    <PageTransition direction="up" staggerChildren={false} className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-gradient">Semesters</span>
          </h1>
          <p className="text-text-muted text-sm mt-1 ml-[52px]">
            Manage your academic timeline
          </p>
        </div>
        <Link href="/semesters/new" className="btn-gradient px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
          + New Semester
        </Link>
      </div>

      {/* List */}
      <StaggerGrid className="space-y-4" delay={100} staggerDelay={80} animation="fadeSlideUp">
        {semesters?.map((sem, i) => {
          const isEnded = new Date(sem.endDate) < new Date();
          return (
            <div
              key={sem.id}
              className="glass rounded-2xl p-5 hover:bg-glass-strong transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                  sem.isCurrent ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20" :
                  "bg-gradient-to-br from-gray-600 to-gray-800 shadow-gray-500/20"
                )}>
                  {sem.isCurrent ? <Calendar className="w-6 h-6 text-white" /> : <BookOpen className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-text group-hover:text-purple-400 transition-colors">
                      {sem.name}
                    </h3>
                    {sem.isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    )}
                    {!sem.isCurrent && isEnded && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gray-500/10 text-gray-400 border border-gray-500/20">
                        ENDED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted mb-2">
                    {new Date(sem.startDate).toLocaleDateString()} — {new Date(sem.endDate).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                    <span className="bg-white/5 px-2 py-1 rounded-md">{sem._count.subjects} subjects</span>
                    <span className="bg-white/5 px-2 py-1 rounded-md">{sem._count.holidays} holidays</span>
                    <span className="bg-white/5 px-2 py-1 rounded-md">{sem._count.examPeriods} exams</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/semesters/${sem.id}`}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {sem.isCurrent ? "Manage" : "View Dashboard"} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}

        {semesters?.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-text-muted">No semesters found. Create one to get started!</p>
          </div>
        )}
      </StaggerGrid>
    </PageTransition>
  );
}
