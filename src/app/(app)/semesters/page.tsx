"use client";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
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


  return (
    <PageTransition direction="up" staggerChildren={false} className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#06d6a0]/10">
            <GraduationCap className="h-6 w-6 text-[#06d6a0]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1a1a2e] dark:text-white">Semesters</h1>
            <p className="text-sm text-[#9ca3af] dark:text-[#6b6b80]">Manage your academic timeline</p>
          </div>
        </div>
        <Link
          href="/semesters/new"
          className="rounded-xl border-2 border-[#cc1a5e] bg-[#FF2D78] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_0_#cc1a5e] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#cc1a5e] active:translate-y-[3px] active:shadow-none dark:border-[#b81e56] dark:shadow-[0_4px_0_0_#b81e56] dark:hover:shadow-[0_2px_0_0_#b81e56] transition-all duration-150 flex items-center gap-2"
        >
          + New Semester
        </Link>
      </div>

      {/* List */}
      <StaggerGrid className="space-y-4" delay={100} staggerDelay={80} animation="fadeSlideUp">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="group rounded-2xl border-2 p-5 transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]"
              style={{ borderLeftWidth: "5px", borderLeftColor: "#4361ee" }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 shrink-0" />
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-gray-200 dark:bg-white/5 rounded-md" />
                  <div className="h-4 w-48 bg-gray-100 dark:bg-white/5 rounded-md" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-gray-100 dark:bg-white/5 rounded-md" />
                    <div className="h-6 w-20 bg-gray-100 dark:bg-white/5 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                 <FieldLoader size="md" />
              </div>
            </div>
          ))
        ) : semesters?.map((sem) => {
          const isEnded = new Date(sem.endDate) < new Date();
          return (
            <div
              key={sem.id}
              className="group rounded-2xl border-2 p-5 transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a] dark:hover:shadow-[0_4px_0_0_#0d0d1a]"
              style={{ borderLeftWidth: "5px", borderLeftColor: "#06d6a0" }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#06d6a0]/10 shrink-0">
                  <Calendar className="h-5 w-5 text-[#06d6a0]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-[#1a1a2e] dark:text-white">
                      {sem.name}
                    </h3>
                    {sem.isCurrent && (
                      <span className="rounded-lg border-2 border-[#05a87e] bg-[#06d6a0] px-2.5 py-0.5 text-xs font-bold text-white shadow-[0_2px_0_0_#05a87e]">
                        ACTIVE
                      </span>
                    )}
                    {!sem.isCurrent && isEnded && (
                      <span className="rounded-lg border-2 px-2.5 py-0.5 text-xs font-bold border-gray-200 bg-white text-[#4a4a5a] shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_2px_0_0_#0d0d1a]">
                        ENDED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#9ca3af] dark:text-[#6b6b80] mb-2">
                    {new Date(sem.startDate).toLocaleDateString()} — {new Date(sem.endDate).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-lg border-2 px-3 py-1 text-xs font-semibold border-gray-200 bg-white text-[#4a4a5a] shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_2px_0_0_#0d0d1a]">
                      {sem._count.subjects} subjects
                    </span>
                    <span className="rounded-lg border-2 px-3 py-1 text-xs font-semibold border-gray-200 bg-white text-[#4a4a5a] shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_2px_0_0_#0d0d1a]">
                      {sem._count.holidays} holidays
                    </span>
                    <span className="rounded-lg border-2 px-3 py-1 text-xs font-semibold border-gray-200 bg-white text-[#4a4a5a] shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_2px_0_0_#0d0d1a]">
                      {sem._count.examPeriods} exams
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/semesters/${sem.id}`}
                  className="rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 border-gray-200 bg-white text-[#4a4a5a] shadow-[0_4px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_4px_0_0_#0d0d1a] dark:hover:shadow-[0_2px_0_0_#0d0d1a]"
                >
                  {sem.isCurrent ? "Manage" : "View Dashboard"} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}

        {semesters?.length === 0 && (
          <div className="rounded-2xl border-2 p-8 text-center border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]">
            <p className="font-bold text-[#1a1a2e] dark:text-white">No semesters found. Create one to get started!</p>
          </div>
        )}
      </StaggerGrid>
    </PageTransition>
  );
}
