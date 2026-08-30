const fs = require('fs');

let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// Ensure Lucide imports are added to DashboardView.tsx
const extraImports = ['TrendingUp', 'BookOpen', 'Flame', 'AlertTriangle', 'Target', 'ChevronRight', 'ArrowDown', 'Plus', 'GraduationCap'];
// Let's just append a new import statement after the first import
content = content.replace(
  'import { useState, useCallback, useEffect } from "react";',
  'import { useState, useCallback, useEffect } from "react";\nimport { TrendingUp, BookOpen, Flame, AlertTriangle, Target, ChevronRight, ArrowDown, Plus, GraduationCap } from "lucide-react";'
);


// 2A: Greeting Section + 2B: Semester Info Banner
const oldHeaderRegex = /\{\/\* Main Degree Program Badge \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const newHeader = `      {/* Greeting */}
      <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        <h1 className="text-2xl font-bold text-white">
          Hello, <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">{displayName}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {dashboard?.semesterName 
            ? \`Your attendance report for \${dashboard.semesterName} is ready. Let's make every class count!\` 
            : "Here is your attendance overview. Let's make every class count!"} 
          <span className="mx-2 opacity-50">·</span>
          {today?.date}
        </p>
      </div>

      {/* Semester Banner */}
      <div className="relative mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 overflow-hidden" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-white">{dashboard?.semesterName || "All Semesters"}</h2>
            <p className="text-sm text-gray-400">{today?.dayName}, {today?.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCurrent && activeSemId && (
            <button
              onClick={() => setShowImportSubjects(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <ArrowDown className="h-4 w-4" /> Import
            </button>
          )}
          <Link href={\`/subjects/new\${semesterId ? \`?semesterId=\${semesterId}\` : ""}\`} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Add Subject
          </Link>
        </div>
      </div>`;
content = content.replace(oldHeaderRegex, newHeader);


// 2C: Stat Cards 
const oldStatsRegex = /\{\/\* Stats Row \*\/\}\s*\{dashboard && \([\s\S]*?<\/StaggerGrid>\s*\)\}/;
const newStatsRow = `      {/* Stats Row */}
      {dashboard && (
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" delay={100} staggerDelay={80} animation="fadeSlideUp">
          {/* Overall */}
          <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">Overall</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white"><AnimatedCounter value={overallPct} suffix="%" /></p>
            </div>
          </div>

          {/* Subjects */}
          <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">Subjects</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white"><AnimatedCounter value={totalSubjects} /></p>
            </div>
          </div>

          {/* Streak */}
          <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {currentStreak > 0 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-amber-500/10 blur-2xl" style={{ animation: "streakGlow 2s ease-in-out infinite" }} />
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">Streak</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                  <Flame className="h-5 w-5" style={currentStreak > 0 ? { animation: "streakFlicker 1.5s ease-in-out infinite" } : undefined} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-white"><AnimatedCounter value={currentStreak} /></p>
                {currentStreak > 0 && (
                  <div className="relative h-8 w-6">
                    <Flame className="h-5 w-5 text-amber-400 absolute bottom-0 left-0" style={{ animation: "streakFlicker 1.5s ease-in-out infinite" }} />
                    <Flame className="h-3 w-3 text-orange-400/60 absolute bottom-1 left-2" style={{ animation: "streakFlicker 1.2s ease-in-out 0.3s infinite" }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* In Danger */}
          <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">{isCurrent ? "In Danger" : "Failed"}</p>
                <div className={\`flex h-10 w-10 items-center justify-center rounded-xl transition-colors \${dangerCount > 0 ? "bg-red-500/10 text-red-400 group-hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20"}\`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <p className={\`text-3xl font-bold \${dangerCount > 0 ? "text-red-400" : "text-white"}\`}><AnimatedCounter value={dangerCount} /></p>
            </div>
          </div>
        </StaggerGrid>
      )}`;
content = content.replace(oldStatsRegex, newStatsRow);

// 2D: Goal Banner
const oldGoalCard = /\{\/\* Goal Mode Card \*\/\}\s*\{isCurrent && goalPlan && \([\s\S]*?\) : null\}\s*<\/div>\s*\)\}/;
const newGoalCard = `      {/* Goal Mode Card */}
      {isCurrent && goalPlan && (
        <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 120ms forwards" }}>
          {goalPlan.goalEnabled && goalPlan.todaysPlan.length > 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/20">
              <button
                onClick={() => setGoalExpanded(!goalExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">Today's Goal Plan</h3>
                    <p className="text-sm text-gray-400">
                      Attend {goalPlan.summary.mustAttend} of {goalPlan.summary.total} to stay on track
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {goalPlan.goalPct}% goal
                  </span>
                  <ChevronDown className={clsx("w-4 h-4 text-gray-500 transition-transform", goalExpanded && "rotate-180")} />
                </div>
              </button>
              {goalExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {goalPlan.todaysPlan.map((cls) => (
                    <div
                      key={cls.scheduleId}
                      className={clsx(
                        "flex items-center gap-3 p-3 rounded-xl border transition",
                        cls.priority === "mandatory" ? "border-red-500/30 bg-red-500/5" :
                        cls.priority === "recommended" ? "border-yellow-500/30 bg-yellow-500/5" :
                        "border-green-500/30 bg-green-500/5"
                      )}
                    >
                      <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: cls.colorHex }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-200 truncate">{cls.subjectName}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> {cls.startTime} - {cls.endTime}
                          {cls.room && <><MapPin className="w-3 h-3 ml-1" /> {cls.room}</>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={clsx(
                          "text-xs font-black px-2 py-1 rounded-lg",
                          cls.priority === "mandatory" ? "bg-red-500/10 text-red-400" :
                          cls.priority === "recommended" ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-green-500/10 text-green-400"
                        )}>
                          {cls.priority === "mandatory" ? "🔴 Must attend" :
                           cls.priority === "recommended" ? "🟡 Should attend" :
                           "🟢 Safe to skip"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !goalPlan.goalEnabled ? (
            <Link href="/settings/goal" className="group relative flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-purple-500/[0.04] to-violet-500/[0.04] backdrop-blur-xl p-5 transition-all duration-300 hover:from-purple-500/[0.08] hover:to-violet-500/[0.08] hover:border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5 cursor-pointer overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Set Your Attendance Goal</h3>
                  <p className="text-sm text-gray-400">Get a daily action plan showing which classes to attend</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </Link>
          ) : null}
        </div>
      )}`;
content = content.replace(oldGoalCard, newGoalCard);


// 2E + 2F: Subject Cards 
const oldSubjects = /\{\/\* Subject Cards \*\/\}\s*\{dashboard && subjectsList\.length > 0 && \([\s\S]*?<\/StaggerGrid>\s*<\/div>\s*\)\}/;
const newSubjects = `      {/* Subject Cards */}
      {dashboard && subjectsList.length > 0 && (
        <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 200ms forwards" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">All Subjects</h2>
            <span className="text-sm text-gray-500">{subjectsList.length} courses</span>
          </div>
          <StaggerGrid className="grid gap-4 md:grid-cols-2" delay={250} staggerDelay={80} animation="fadeSlideUp">
            {subjectsList.map((s: any, i: number) => {
              const percentage = s.currentPercentage ?? (s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 100);
              const min = s.minAttendancePct ?? 75;
              const statusLabel = isCurrent ? (percentage >= min ? "On track" : percentage >= min - 5 ? "At risk" : "Action needed") :
                                            (percentage >= min ? "Met requirement" : "Failed requirement");
              
              const accentColors = [
                { from: "from-purple-500", to: "to-violet-600", hover: "hover:border-purple-500/20", shadow: "hover:shadow-purple-500/10", track: "bg-purple-500/20" },
                { from: "from-blue-500", to: "to-indigo-600", hover: "hover:border-blue-500/20", shadow: "hover:shadow-blue-500/10", track: "bg-blue-500/20" },
                { from: "from-emerald-500", to: "to-green-600", hover: "hover:border-emerald-500/20", shadow: "hover:shadow-emerald-500/10", track: "bg-emerald-500/20" },
                { from: "from-amber-500", to: "to-orange-600", hover: "hover:border-amber-500/20", shadow: "hover:shadow-amber-500/10", track: "bg-amber-500/20" },
                { from: "from-pink-500", to: "to-rose-600", hover: "hover:border-pink-500/20", shadow: "hover:shadow-pink-500/10", track: "bg-pink-500/20" },
                { from: "from-cyan-500", to: "to-teal-600", hover: "hover:border-cyan-500/20", shadow: "hover:shadow-cyan-500/10", track: "bg-cyan-500/20" },
                { from: "from-red-500", to: "to-rose-600", hover: "hover:border-red-500/20", shadow: "hover:shadow-red-500/10", track: "bg-red-500/20" },
              ];
              const accent = accentColors[i % accentColors.length];
              const barColorStyle = s.colorHex ? { backgroundColor: s.colorHex, backgroundImage: 'none' } : {};

              return (
              <Link key={s.id} href={\`/subjects/\${s.id}\`}
                className={\`group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:bg-white/[0.06] \${accent.hover} hover:shadow-lg \${accent.shadow} hover:-translate-y-1 cursor-pointer overflow-hidden block\`}
              >
                {/* Top gradient line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                
                {/* Left accent bar — gradient */}
                <div className={\`absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b \${accent.from} \${accent.to}\`} style={barColorStyle} />
                
                <div className="pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0 pr-4">
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">{s.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{s.code}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  {/* Progress bar — glass track + gradient fill */}
                  <div className="mt-3 mb-2">
                    <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={\`h-full rounded-full transition-all duration-700 ease-out \${
                          percentage >= 75
                            ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400"
                            : percentage >= 60
                            ? "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400"
                            : "bg-gradient-to-r from-red-600 via-red-500 to-rose-400"
                        }\`}
                        style={{ width: \`\${Math.min(100, percentage)}%\` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between">
                    <span className={\`text-sm font-semibold \${
                      percentage >= 75 ? "text-emerald-400" :
                      percentage >= 60 ? "text-amber-400" :
                      "text-red-400"
                    }\`}>
                      {percentage}%
                    </span>
                    <span className={\`text-xs font-medium \${
                      percentage >= 75 ? "text-emerald-400/60" :
                      percentage >= 60 ? "text-amber-400/60" :
                      "text-red-400/60"
                    }\`}>
                      {statusLabel}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-amber-400/70" /> {s.totalPresent ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
            )})}
          </StaggerGrid>
        </div>
      )}`;
content = content.replace(oldSubjects, newSubjects);


// Remove the old StatCard definition if it's there
const oldStatCardFn = /function StatCard\([\s\S]*?return \([\s\S]*?\);\n\}/;
content = content.replace(oldStatCardFn, '');


fs.writeFileSync('src/components/DashboardView.tsx', content);
