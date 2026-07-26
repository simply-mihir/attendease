export default function Loading() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-white/10 animate-pulse" />
          <div className="h-4 w-32 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-white/10 animate-pulse" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass rounded-2xl p-5 space-y-3">
            <div className="h-4 w-20 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-8 w-16 rounded-lg bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 rounded-lg bg-white/10 animate-pulse" />
                <div className="h-3 w-20 rounded-lg bg-white/5 animate-pulse" />
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
