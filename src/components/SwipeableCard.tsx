"use client";

import { useRef, useState, ReactNode } from "react";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = "Present",
  leftLabel = "Absent",
  disabled = false,
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const threshold = 80; // px to trigger action

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping || disabled) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    // Dampen the movement (rubber band feel)
    const dampened = diff * 0.5;
    setOffset(dampened);
  };

  const handleTouchEnd = () => {
    if (!swiping || disabled) return;
    setSwiping(false);

    if (offset > threshold && onSwipeRight) {
      // Swipe right — Present
      setOffset(200); // Animate out
      if (navigator.vibrate) navigator.vibrate(50);
      setTimeout(() => {
        onSwipeRight();
        setOffset(0);
      }, 200);
    } else if (offset < -threshold && onSwipeLeft) {
      // Swipe left — Absent
      setOffset(-200);
      if (navigator.vibrate) navigator.vibrate(50);
      setTimeout(() => {
        onSwipeLeft();
        setOffset(0);
      }, 200);
    } else {
      // Snap back
      setOffset(0);
    }
  };

  const absOffset = Math.abs(offset);
  const revealOpacity = Math.min(absOffset / threshold, 1);

  return (
    <div className="relative overflow-hidden rounded-2xl h-full">
      {/* Background reveal — shows Present/Absent label */}
      <div
        className={`absolute inset-0 flex items-center rounded-2xl transition-opacity ${
          offset > 0
            ? "justify-start pl-6 bg-green-500/20"
            : "justify-end pr-6 bg-red-500/20"
        }`}
        style={{ opacity: revealOpacity }}
      >
        <span
          className={`text-sm font-bold ${
            offset > 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {offset > 0 ? `✓ ${rightLabel}` : `✗ ${leftLabel}`}
        </span>
      </div>

      {/* Card content */}
      <div
        ref={cardRef}
        className="relative z-10 transition-transform h-full"
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
