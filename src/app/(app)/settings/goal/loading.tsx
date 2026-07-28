export default function Loading() {
  return (
    <div className="space-y-4 animate-fade-in">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 space-y-3">
          <div className="h-5 w-1/3 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-4 w-2/3 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-4 w-1/2 rounded-lg bg-white/5 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
