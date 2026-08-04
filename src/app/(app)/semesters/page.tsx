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
              className="group rounded-2xl border-2 p-5 transition-all duration-150 border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 mb-3" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-gray-200 dark:bg-white/5 rounded-md" />
                <div className="h-4 w-48 bg-gray-100 dark:bg-white/5 rounded-md" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-20 bg-gray-100 dark:bg-white/5 rounded-md" />
                  <div className="h-6 w-20 bg-gray-100 dark:bg-white/5 rounded-md" />
                </div>
              </div>
            </div>
          ))
        ) : semesters?.map((sem) => {
          const isEnded = new Date(sem.endDate) < new Date();
          const color = "#06b6d4"; // Cyan color for all cards
          
          return (
            <Link
              key={sem.id}
              href={`/semesters/${sem.id}`}
              className="group relative rounded-2xl border-2 p-5 transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-5 overflow-hidden cursor-pointer"
              style={{
                borderColor: `${color}40`,
                backgroundColor: `${color}0D`,
                boxShadow: `0 6px 0 0 ${color}30`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 0 0 ${color}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 6px 0 0 ${color}30`;
                e.currentTarget.style.transform = '';
              }}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${color}08 0%, ${color}15 50%, ${color}08 100%)`,
                  backgroundSize: "200% 200%",
                  animation: "subjectCardShimmer 3s ease-in-out infinite",
                }} />

              {/* Top accent line */}
              <div className="absolute inset-x-0 top-0 h-[2px]"
                style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }} />

              <div className="relative flex flex-col md:flex-row gap-4 items-start md:items-center flex-1">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${color}1A`, color: color }}>
                  <Calendar className="h-6 w-6" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-extrabold text-xl text-[#1a1a2e] dark:text-white">
                      {sem.name}
                    </h3>
                    {sem.isCurrent && (
                       <span className="rounded-lg border-2 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase"
                         style={{ borderColor: `${color}40`, backgroundColor: `${color}20`, color: color }}>
                         Active
                       </span>
                     )}
                     {!sem.isCurrent && isEnded && (
                       <span className="rounded-lg border-2 border-gray-200 bg-white px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase text-[#4a4a5a] shadow-[0_2px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_2px_0_0_#0d0d1a]">
                         Ended
                       </span>
                     )}
                  </div>
                  
                  <p className="text-sm font-semibold text-[#9ca3af] dark:text-[#6b6b80] mb-3 md:mb-2">
                    {new Date(sem.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} — {new Date(sem.endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 text-[#4a4a5a] dark:text-[#c4c4d4]">
                      {sem._count.subjects} Subjects
                    </span>
                    <span className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 text-[#4a4a5a] dark:text-[#c4c4d4]">
                      {sem._count.holidays} Holidays
                    </span>
                    <span className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 text-[#4a4a5a] dark:text-[#c4c4d4]">
                      {sem._count.examPeriods} Exams
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="relative shrink-0 flex items-center mt-2 md:mt-0">
                <div 
                  className="rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] group-hover:translate-y-[2px] group-hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)]"
                  style={{ 
                    borderColor: `${color}40`, 
                    backgroundColor: `${color}1A`, 
                    color: color,
                  }}
                >
                  {sem.isCurrent ? "Manage" : "View Dashboard"} <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          );
        })}

        {semesters?.length === 0 && (
          <div className="rounded-2xl border-2 p-8 text-center border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a] col-span-full">
            <div className="w-16 h-16 rounded-2xl bg-[#06b6d4]/10 text-[#06b6d4] flex items-center justify-center mx-auto mb-3">
               <Calendar className="w-8 h-8" />
            </div>
            <p className="font-bold text-[#1a1a2e] dark:text-white mb-2">No semesters found</p>
            <p className="text-sm text-gray-500 mb-4">Create your first semester to start tracking.</p>
          </div>
        )}
      </StaggerGrid>
    </PageTransition>
  );
}
