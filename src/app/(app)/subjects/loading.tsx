export default function SubjectsLoading() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header + add button */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-10 w-36 rounded-xl bg-white/5 animate-pulse" />
      </div>
      {/* Subject cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/5 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/3 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-3 w-1/2 rounded-lg bg-white/5 animate-pulse" />
          </div>
          <div className="h-8 w-16 rounded-lg bg-white/5 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
