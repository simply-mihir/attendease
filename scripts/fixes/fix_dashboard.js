const fs = require('fs');

let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// 1. Header & Semester Banner replacement
const newHeader = `      {/* Greeting — FIRST element */}
      <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 0ms forwards" }}>
        <h1 className="text-2xl font-bold text-white">
          Hello, <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">{displayName}</span> 👋
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
            <span className="text-lg">📚</span>
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
              <Download className="w-4 h-4" /> Import
            </button>
          )}
          <Link href={\`/subjects/new\${semesterId ? \`?semesterId=\${semesterId}\` : ""}\`} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Add Subject
          </Link>
        </div>
      </div>`;

content = content.replace(/\{\/\* Header \*\/\}\s*<div className="flex items-center justify-between mb-6"[\s\S]*?<\/Link>\s*<\/div>\s*<\/div>/, newHeader);

// 2. Fix stray 0 above stats? It might be `{dashboard && (` but wait, `dashboard` is an object.
// But there could be another one. Let's make sure it's `<div className="pb-8">` wrapper.
content = content.replace(/<PageTransition direction="up" staggerChildren=\{false\} className="space-y-6">/, '<PageTransition direction="up" staggerChildren={false} className="space-y-6 pb-8">');

// 3. Stat Card updates
const newStatsRow = `      {/* Stats Row */}
      {dashboard && (
        <StaggerGrid
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          delay={100}
          staggerDelay={80}
          animation="card3DEnter"
        >
          <StatCard label="Overall" value={<AnimatedCounter value={overallPct} suffix="%" />}
            icon="📈" bgClass="bg-emerald-500/10 text-emerald-400 text-lg" glowClass="via-emerald-500/30" />
          <StatCard label="Subjects" value={<AnimatedCounter value={totalSubjects} />}
            icon="📖" bgClass="bg-blue-500/10 text-blue-400 text-lg" glowClass="via-blue-500/30" />
          <StatCard label="Streak" value={<span className="flex items-center gap-1"><AnimatedCounter value={currentStreak} /> <span className="text-lg">🔥</span></span>}
            icon="🔥" bgClass="bg-amber-500/10 text-amber-400 text-lg" glowClass="via-amber-500/30" />
          <StatCard label={isCurrent ? "In Danger" : "Failed"} value={<span className={dangerCount > 0 ? "text-red-400" : "text-white"}><AnimatedCounter value={dangerCount} /></span>}
            icon={dangerCount > 0 ? "⚠️" : "✅"} bgClass={dangerCount > 0 ? "bg-red-500/10 text-red-400 text-lg" : "bg-emerald-500/10 text-emerald-400 text-lg"} glowClass={dangerCount > 0 ? "via-red-500/30" : "via-emerald-500/30"} />
        </StaggerGrid>
      )}`;

content = content.replace(/\{\/\* Stats Row \*\/\}\s*\{dashboard && \([\s\S]*?<\/StaggerGrid>\s*\)\}/, newStatsRow);

// StatCard Component
const newStatCard = `function StatCard({ label, value, icon, bgClass, glowClass }: { label: string; value: React.ReactNode; icon: React.ReactNode; bgClass: string; glowClass?: string }) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/5 overflow-hidden">
      <div className={\`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent \${glowClass || "via-purple-500/30"} to-transparent\`} />
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">{label}</p>
        <div className={\`flex h-9 w-9 items-center justify-center rounded-xl \${bgClass}\`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}`;

content = content.replace(/function StatCard\(\{ label, value, icon, bgClass \}: \{ label: string; value: React.ReactNode; icon: React.ReactNode; bgClass: string \}\) \{[\s\S]*?return \([\s\S]*?\);\n\}/, newStatCard);


// 4. Goal Plan Card spacing
content = content.replace(/<div style=\{\{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 120ms forwards" \}\}>/, '<div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 120ms forwards" }}>');


// 5. Subject Cards
const oldSubjectsStart = `      {/* Subject Cards */}
      {dashboard && subjectsList.length > 0 && (
        <div style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 200ms forwards" }}>
          <div className="flex items-center justify-between mb-4">`;

const newSubjectsStart = `      {/* Subject Cards */}
      {dashboard && subjectsList.length > 0 && (
        <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 200ms forwards" }}>
          <div className="flex items-center justify-between mb-4">`;
content = content.replace(oldSubjectsStart, newSubjectsStart);

const oldSubjectsMap = `<StaggerGrid className="grid gap-4 md:grid-cols-2" delay={250} staggerDelay={80} animation="fadeSlideUp">
            {subjectsList.map((s: any, i: number) => {
              // Handle both new and old properties
              const pct = s.currentPercentage ?? (s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 100);
              const min = s.minAttendancePct ?? 75;
              const color = s.statusColor || (pct >= min ? "green" : (pct >= min - 5 ? "yellow" : "red"));
              
              const fillClass = pct >= min ? "from-emerald-600 via-emerald-500 to-green-500" :
                                pct >= min - 5 ? "from-amber-600 via-amber-500 to-yellow-500" :
                                "from-red-600 via-red-500 to-rose-500";
              const statusLabel = isCurrent ? (pct >= min ? "On track" : pct >= min - 5 ? "At risk" : "Action needed") :
                                            (pct >= min ? "Met requirement" : "Failed requirement");

              return (
              <Link key={s.id} href={\`/subjects/\${s.id}\`}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/5 overflow-hidden block">
                {/* Top gradient line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                
                {/* Subject color indicator — left border accent */}
                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ backgroundColor: s.colorHex }} />
                
                {/* Content */}
                <div className="pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate pr-4">
                      {s.name}
                    </h3>
                    <span className="shrink-0 text-xs text-gray-500">{s.code}</span>
                  </div>
                  
                  {/* Attendance percentage */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1">
                      {/* Glass progress bar track */}
                      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                        {/* Gradient fill */}
                        <div
                          className={\`h-full rounded-full bg-gradient-to-r \${fillClass} transition-all duration-500\`}
                          style={{ width: \`\${Math.min(100, pct)}%\` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white min-w-[3rem] text-right">
                      {pct}%
                    </span>
                  </div>

                  {/* Status + stats row */}
                  <div className="flex items-center justify-between mt-2">
                    <span className={\`text-xs font-medium \${
                      pct >= min ? "text-emerald-400" :
                      pct >= min - 5 ? "text-amber-400" :
                      "text-red-400"
                    }\`}>
                      {statusLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {s.totalPresent ?? 0}/{s.totalClassesHeld ?? 0} classes
                      </span>
                      {(s.totalCancelled ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-bold bg-slate-500/10 px-2 py-0.5 rounded-md">
                          <Ban className="w-3 h-3" /> {s.totalCancelled}
                        </span>
                      )}
                      {(s.streakCount ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded-md">
                          <Flame className="w-3 h-3" />{s.streakCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Arrow icon on hover */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 group-hover:text-purple-400 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            )})}
          </StaggerGrid>`;

const newSubjectsMap = `<StaggerGrid className="grid gap-4 md:grid-cols-2" delay={250} staggerDelay={80} animation="fadeSlideUp">
            {subjectsList.map((s: any, i: number) => {
              const pct = s.currentPercentage ?? (s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 100);
              const min = s.minAttendancePct ?? 75;
              const statusLabel = isCurrent ? (pct >= min ? "On track" : pct >= min - 5 ? "At risk" : "Action needed") :
                                            (pct >= min ? "Met requirement" : "Failed requirement");
              
              const accentColors = [
                "from-purple-500 to-violet-600",
                "from-blue-500 to-indigo-600",
                "from-emerald-500 to-green-600",
                "from-amber-500 to-orange-600",
                "from-pink-500 to-rose-600",
                "from-cyan-500 to-teal-600",
              ];
              const accentClass = s.colorHex ? \`from-[\${s.colorHex}] to-[\${s.colorHex}]\` : accentColors[i % accentColors.length];

              return (
              <Link key={s.id} href={\`/subjects/\${s.id}\`}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer overflow-hidden block">
                {/* Top gradient line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                
                {/* Subject color indicator — left border accent */}
                <div className={\`absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b \${accentClass}\`} style={s.colorHex ? { backgroundColor: s.colorHex, backgroundImage: 'none' } : {}} />
                
                {/* Content */}
                <div className="pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0 pr-4">
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                        {s.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{s.code}</p>
                    </div>
                    <span className="shrink-0 text-gray-600 group-hover:text-purple-400 transition-colors">→</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3 mb-2">
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={\`h-full rounded-full transition-all duration-700 \${
                          pct >= 75
                            ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400"
                            : pct >= 60
                            ? "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400"
                            : "bg-gradient-to-r from-red-600 via-red-500 to-rose-400"
                        }\`}
                        style={{ width: \`\${Math.min(100, pct)}%\` }}
                      />
                    </div>
                  </div>

                  {/* Status + stats row */}
                  <div className="flex items-center justify-between mt-2">
                    <span className={\`text-sm font-semibold \${
                      pct >= 75 ? "text-emerald-400" :
                      pct >= 60 ? "text-amber-400" :
                      "text-red-400"
                    }\`}>
                      {pct}%
                    </span>
                    <span className={\`text-xs font-medium \${
                      statusLabel === "On track" || statusLabel === "Met requirement" ? "text-emerald-400/70" :
                      statusLabel === "At risk" ? "text-amber-400/70" :
                      "text-red-400/70"
                    }\`}>
                      {statusLabel}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      🔥 {s.totalPresent ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
            )})}
          </StaggerGrid>`;
content = content.replace(oldSubjectsMap, newSubjectsMap);

fs.writeFileSync('src/components/DashboardView.tsx', content);
