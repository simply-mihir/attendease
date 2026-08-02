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
    return <FuturisticLoader variant="section" title="Loading semesters" Icon={GraduationCap} />;
  }

  return (
    <PageTransition direction="up" staggerChildren={false} className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            Semesters
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-[52px]">
            Manage your academic timeline
          </p>
        </div>
        <Link
          href="/semesters/new"
          className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center gap-2 shadow-md shadow-purple-500/20 hover:shadow-lg transition cursor-pointer"
        >
          + New Semester
        </Link>
      </div>

      {/* List */}
      <StaggerGrid className="space-y-4" delay={100} staggerDelay={80} animation="fadeSlideUp">
        {semesters?.map((sem) => {
          const isEnded = new Date(sem.endDate) < new Date();
          return (
            <div
              key={sem.id}
              className="rounded-3xl p-5 sm:p-6 bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                  sem.isCurrent ? "bg-gradient-to-br from-teal-500 to-emerald-500 shadow-teal-500/20 text-white" :
                  "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                )}>
                  {sem.isCurrent ? <Calendar className="w-6 h-6 text-white" /> : <BookOpen className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-extrabold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {sem.name}
                    </h3>
                    {sem.isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20">
                        ACTIVE
                      </span>
                    )}
                    {!sem.isCurrent && isEnded && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10">
                        ENDED
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(sem.startDate).toLocaleDateString()} — {new Date(sem.endDate).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-white/5">{sem._count.subjects} subjects</span>
                    <span className="bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-white/5">{sem._count.holidays} holidays</span>
                    <span className="bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-white/5">{sem._count.examPeriods} exams</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/semesters/${sem.id}`}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 text-sm font-semibold transition flex items-center gap-2"
                >
                  {sem.isCurrent ? "Manage" : "View Dashboard"} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}

        {semesters?.length === 0 && (
          <div className="rounded-3xl p-8 text-center bg-white border border-gray-200/60 dark:bg-white/[0.04] dark:border-white/[0.08]">
            <p className="text-gray-500 dark:text-gray-400">No semesters found. Create one to get started!</p>
          </div>
        )}
      </StaggerGrid>
    </PageTransition>
  );
}
