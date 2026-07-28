export default function CalendarLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg bg-white/5 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-10 w-10 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>
      {/* Calendar grid */}
      <div className="glass rounded-2xl p-4">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`h-${i}`} className="h-6 rounded bg-white/5 animate-pulse" />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
