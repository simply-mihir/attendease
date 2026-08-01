const fs = require('fs');

let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// 1. Header (Main Degree Program + Sem 5)
const oldHeader = `      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hello, <span className="text-purple-400">{displayName}</span> 👋
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {dashboard?.semesterName 
              ? \`Your attendance report for \${dashboard.semesterName} is ready. Let's make every class count!\` 
              : "Here is your attendance overview. Let's make every class count!"} 
            <span className="mx-2 opacity-50">•</span>
            {today?.dayName}, {today?.date}
          </p>
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

const newHeader = `      {/* Main Degree Program Badge */}
      <div className="flex mb-4">
        <button className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-surface-3 transition">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
            🎓
          </div>
          Main Degree Program
          <ChevronDown className="h-3 w-3 text-gray-500" />
        </button>
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-indigo-400">
            {dashboard?.semesterName || "Sem 5"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {today?.dayName}, {today?.date}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isCurrent && activeSemId && (
            <button
              onClick={() => setShowImportSubjects(true)}
              className="flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-300 transition-all"
            >
              <Download className="w-4 h-4" /> IMPORT
            </button>
          )}
          <Link href={\`/subjects/new\${semesterId ? \`?semesterId=\${semesterId}\` : ""}\`} className="flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-400 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> ADD SUBJECT
          </Link>
        </div>
      </div>`;

content = content.replace(oldHeader, newHeader);

// Fix the other possible old header format just in case it didn't match
const oldHeaderAlt = /\{\/\* Header \*\/\}\s*<div className="flex items-center justify-between mb-6"[\s\S]*?<\/div>\s*<\/div>/;
if (!content.includes("Main Degree Program Badge")) {
  content = content.replace(oldHeaderAlt, newHeader);
}

// 2. Fix Stats Row
const oldStats = /\{\/\* Stats Row \*\/\}\s*\{dashboard && \([\s\S]*?<\/StaggerGrid>\s*\)\}/;
const newStatsRow = `      {/* Stats Row */}
      {dashboard && (
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" delay={100} staggerDelay={80} animation="fadeSlideUp">
          <StatCard label="Overall" value={<AnimatedCounter value={overallPct} suffix="%" />}
            icon={<TrendingUp className="w-4 h-4" />} iconBg="bg-emerald-500" iconColor="text-white" />
          <StatCard label="Subjects" value={<AnimatedCounter value={totalSubjects} />}
            icon={<BookOpen className="w-4 h-4" />} iconBg="bg-blue-500" iconColor="text-white" />
          <StatCard label="Streak" value={<span className="flex items-center gap-2"><AnimatedCounter value={currentStreak} /> <span className="text-sm font-normal text-orange-500 flex items-center gap-1">🔥 <AnimatedCounter value={currentStreak} /></span></span>}
            icon={<Flame className="w-4 h-4" />} iconBg="bg-orange-500" iconColor="text-white" />
          <StatCard label={isCurrent ? "In Danger" : "Failed"} value={<AnimatedCounter value={dangerCount} />}
            icon={dangerCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />} iconBg="bg-teal-400" iconColor="text-white" />
        </StaggerGrid>
      )}`;
content = content.replace(oldStats, newStatsRow);

// StatCard Component
const oldStatCardFn = /function StatCard\([\s\S]*?return \([\s\S]*?\);\n\}/;
const newStatCardFn = `function StatCard({ label, value, icon, iconBg, iconColor }: { label: string; value: React.ReactNode; icon: React.ReactNode; iconBg: string; iconColor: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1e1e2d] p-5 flex flex-col justify-between h-32">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        <div className={\`flex h-8 w-8 items-center justify-center rounded-lg \${iconBg} \${iconColor}\`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white mt-auto">{value}</p>
    </div>
  );
}`;
content = content.replace(oldStatCardFn, newStatCardFn);


// 3. Goal Mode Card
const oldGoalCard = /\{\/\* Goal Mode Card \*\/\}\s*\{isCurrent && goalPlan && \([\s\S]*?\) : null\}\s*<\/div>\s*\)\}/;
const newGoalCard = `      {/* Goal Mode Card */}
      {isCurrent && goalPlan && (
        <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 120ms forwards" }}>
          {goalPlan.goalEnabled && goalPlan.todaysPlan.length > 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#1e1e2d] overflow-hidden transition-all">
              <button
                onClick={() => setGoalExpanded(!goalExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#252536] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
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
                        "flex items-center gap-3 p-3 rounded-xl border-2 transition",
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
            <Link href="/settings/goal" className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1e1e2d] p-4 hover:bg-[#252536] transition cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Set Your Attendance Goal</h3>
                  <p className="text-sm text-gray-400">Get a daily action plan showing which classes to attend</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </Link>
          ) : null}
        </div>
      )}`;
content = content.replace(oldGoalCard, newGoalCard);


// 4. Subject Cards
const oldSubjects = /\{\/\* Subject Cards \*\/\}\s*\{dashboard && subjectsList\.length > 0 && \([\s\S]*?<\/StaggerGrid>\s*<\/div>\s*\)\}/;
const newSubjects = `      {/* Subject Cards */}
      {dashboard && subjectsList.length > 0 && (
        <div className="mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.4s ease-out 200ms forwards" }}>
          <h2 className="text-lg font-semibold text-white mb-4">All Subjects</h2>
          <StaggerGrid className="grid gap-4 md:grid-cols-2" delay={250} staggerDelay={80} animation="fadeSlideUp">
            {subjectsList.map((s: any, i: number) => {
              const pct = s.currentPercentage ?? (s.totalClassesHeld > 0 ? Math.round(((s.totalPresent + s.totalLate) / s.totalClassesHeld) * 100) : 100);
              const min = s.minAttendancePct ?? 75;
              const statusLabel = isCurrent ? (pct >= min ? "On track" : pct >= min - 5 ? "At risk" : "Action needed") :
                                            (pct >= min ? "Met requirement" : "Failed requirement");
              
              const accentColors = [
                "bg-blue-500",
                "bg-cyan-500",
                "bg-pink-500",
                "bg-purple-500",
              ];
              const barColor = s.colorHex ? \`bg-[\${s.colorHex}]\` : accentColors[i % accentColors.length];

              return (
              <Link key={s.id} href={\`/subjects/\${s.id}\`}
                className="relative rounded-xl border border-white/10 bg-[#1e1e2d] p-5 block hover:bg-[#252536] transition overflow-hidden">
                
                {/* Left thick accent bar */}
                <div className={\`absolute left-0 top-4 bottom-4 w-1.5 rounded-r-md \${barColor}\`} style={s.colorHex ? { backgroundColor: s.colorHex } : {}} />
                
                <div className="pl-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="min-w-0 pr-4">
                      <h3 className="font-semibold text-white truncate">{s.name}</h3>
                      <p className="text-xs text-gray-400">{s.code}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  </div>
                  
                  {/* Solid thick progress bar */}
                  <div className="h-1.5 w-full bg-white/10 rounded-full mb-3">
                    <div
                      className={\`h-full rounded-full transition-all duration-700 \${pct >= min ? "bg-emerald-500" : pct >= min - 5 ? "bg-amber-500" : "bg-red-500"}\`}
                      style={{ width: \`\${Math.min(100, pct)}%\` }}
                    />
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-xs">
                    <span className={\`\${pct >= min ? "text-emerald-500" : pct >= min - 5 ? "text-amber-500" : "text-red-500"} font-semibold\`}>
                      {pct}%
                    </span>
                    <span className="text-gray-400">{statusLabel}</span>
                    <span className="text-orange-500 flex items-center gap-1">
                      🔥 {s.totalPresent ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
            )})}
          </StaggerGrid>
        </div>
      )}`;
content = content.replace(oldSubjects, newSubjects);

fs.writeFileSync('src/components/DashboardView.tsx', content);
