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
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-[#1a1a2e] dark:text-white tracking-tight">
            <div className="w-11 h-11 rounded-2xl bg-[#7b2cbf] border-2 border-[#5a189a] flex items-center justify-center shadow-[0_3px_0_0_#5a189a]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            Semesters
          </h1>
          <p className="text-[#4a4a5a] dark:text-[#6b6b80] text-sm font-bold mt-1 ml-[56px]">
            Manage your academic timeline
          </p>
        </div>
        <Link
          href="/semesters/new"
          className="btn-3d-primary px-4 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer"
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
              className="card-3d p-5 sm:p-6 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={clsx(
                  "w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-sm",
                  sem.isCurrent
                    ? "bg-[#06d6a0] border-[#038c67] shadow-[0_3px_0_0_#038c67] text-white"
                    : "bg-gray-100 dark:bg-[#141425] border-gray-200 dark:border-[#2a2a3d] text-gray-500 dark:text-gray-400 shadow-[0_2px_0_0_rgba(0,0,0,0.06)]"
                )}>
                  {sem.isCurrent ? <Calendar className="w-6 h-6 text-white" /> : <BookOpen className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-black text-lg text-[#1a1a2e] dark:text-white group-hover:text-[#7b2cbf] transition-colors">
                      {sem.name}
                    </h3>
                    {sem.isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#06d6a0]/15 text-[#06d6a0] border border-[#06d6a0]">
                        ACTIVE
                      </span>
                    )}
                    {!sem.isCurrent && isEnded && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                        ENDED
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#4a4a5a] dark:text-[#6b6b80] mb-2">
                    {new Date(sem.startDate).toLocaleDateString()} — {new Date(sem.endDate).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-3 text-xs font-black text-[#4a4a5a] dark:text-[#6b6b80] flex-wrap">
                    <span className="bg-gray-50 dark:bg-[#141425] px-2.5 py-1 rounded-xl border-2 border-gray-200 dark:border-[#2a2a3d] shadow-[0_2px_0_0_rgba(0,0,0,0.06)]">{sem._count.subjects} subjects</span>
                    <span className="bg-gray-50 dark:bg-[#141425] px-2.5 py-1 rounded-xl border-2 border-gray-200 dark:border-[#2a2a3d] shadow-[0_2px_0_0_rgba(0,0,0,0.06)]">{sem._count.holidays} holidays</span>
                    <span className="bg-gray-50 dark:bg-[#141425] px-2.5 py-1 rounded-xl border-2 border-gray-200 dark:border-[#2a2a3d] shadow-[0_2px_0_0_rgba(0,0,0,0.06)]">{sem._count.examPeriods} exams</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/semesters/${sem.id}`}
                  className="btn-3d-secondary px-4 py-2.5 text-xs font-black transition flex items-center gap-2 cursor-pointer"
                >
                  {sem.isCurrent ? "Manage" : "View Dashboard"} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}

        {semesters?.length === 0 && (
          <div className="card-3d p-8 text-center">
            <p className="text-[#4a4a5a] dark:text-[#6b6b80] font-bold">No semesters found. Create one to get started!</p>
          </div>
        )}
      </StaggerGrid>
    </PageTransition>
  );
}
