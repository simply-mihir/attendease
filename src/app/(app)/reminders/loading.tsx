export default function RemindersLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="h-28 glass p-6 rounded-3xl animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 glass rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 glass rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
