export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-8 w-36 rounded-lg bg-white/5 animate-pulse" />
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 space-y-3">
            <div className="h-4 w-20 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-8 w-16 rounded-lg bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
      {/* Chart placeholder */}
      <div className="glass rounded-2xl p-6">
        <div className="h-5 w-40 rounded-lg bg-white/5 animate-pulse mb-4" />
        <div className="h-64 w-full rounded-xl bg-white/5 animate-pulse" />
      </div>
      {/* Heatmap placeholder */}
      <div className="glass rounded-2xl p-6">
        <div className="h-5 w-48 rounded-lg bg-white/5 animate-pulse mb-4" />
        <div className="h-32 w-full rounded-xl bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
