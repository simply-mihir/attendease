"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      {/* Schedule cards */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SubjectsSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function NotificationSettingsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-56 bg-white/5 rounded-lg" />
        <div className="h-4 w-72 bg-white/5 rounded-lg mt-2" />
      </div>

      {/* Push Notifications Card */}
      <div className="card-glass p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-5 w-40 bg-white/5 rounded-lg" />
            <div className="h-3 w-24 bg-white/5 rounded-lg mt-2" />
          </div>
          <div className="h-7 w-16 bg-white/5 rounded-full" />
        </div>
        <div className="h-12 w-full bg-white/5 rounded-xl" />
        <div className="h-3 w-64 bg-white/5 rounded-lg" />
      </div>

      {/* Timing Card */}
      <div className="card-glass p-5 space-y-5">
        <div className="h-5 w-20 bg-white/5 rounded-lg" />
        {/* Timezone */}
        <div className="space-y-2">
          <div className="h-4 w-24 bg-white/5 rounded-lg" />
          <div className="h-10 w-full bg-white/5 rounded-xl" />
        </div>
        {/* Brief time */}
        <div className="space-y-2">
          <div className="h-4 w-36 bg-white/5 rounded-lg" />
          <div className="h-3 w-48 bg-white/5 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-white/5 rounded-xl" />
            <div className="h-10 w-20 bg-white/5 rounded-xl" />
          </div>
        </div>
        {/* Report time */}
        <div className="space-y-2">
          <div className="h-4 w-36 bg-white/5 rounded-lg" />
          <div className="h-3 w-48 bg-white/5 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-white/5 rounded-xl" />
            <div className="h-10 w-20 bg-white/5 rounded-xl" />
          </div>
        </div>
        {/* Pre-class */}
        <div className="space-y-2">
          <div className="h-4 w-36 bg-white/5 rounded-lg" />
          <div className="h-10 w-full bg-white/5 rounded-xl" />
        </div>
      </div>

      {/* Notification Types Card */}
      <div className="card-glass p-5 space-y-5">
        <div className="h-5 w-40 bg-white/5 rounded-lg" />
        <div className="h-3 w-64 bg-white/5 rounded-lg" />
        {/* Channel toggles */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl" />
          ))}
        </div>
        {/* Type rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
            <div className="space-y-1">
              <div className="h-4 w-32 bg-white/5 rounded-lg" />
              <div className="h-3 w-24 bg-white/5 rounded-lg" />
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 bg-white/5 rounded-lg" />
              <div className="h-8 w-8 bg-white/5 rounded-lg" />
              <div className="h-8 w-8 bg-white/5 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
