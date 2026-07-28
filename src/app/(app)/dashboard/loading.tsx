export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 space-y-3">
            <div className="h-4 w-20 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-8 w-16 rounded-lg bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
      {/* Today's schedule */}
      <div className="space-y-3">
        <div className="h-6 w-40 rounded-lg bg-white/5 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/3 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-3 w-1/4 rounded-lg bg-white/5 animate-pulse" />
            </div>
            <div className="h-9 w-24 rounded-xl bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
      {/* Danger alerts placeholder */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="h-5 w-32 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-4 w-full rounded-lg bg-white/5 animate-pulse" />
        <div className="h-4 w-2/3 rounded-lg bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
