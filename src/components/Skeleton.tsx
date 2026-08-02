"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg bg-gray-200/60 dark:bg-white/[0.06] skeleton-shimmer ${className}`}
    />
  );
}
