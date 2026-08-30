"use client";

import { useEffect, useState, ReactNode, Children } from "react";

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
  delay?: number;         // base delay before first item
  staggerDelay?: number;  // ms between each item
  animation?: "fadeSlideUp" | "fadeSlideLeft" | "fadeSlideRight" | "scaleIn" | "flipIn" | "glowIn" | "card3DEnter";
}

export function StaggerGrid({
  children,
  className = "",
  delay = 0,
  staggerDelay = 100,
  animation = "fadeSlideUp",
}: StaggerGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const childArray = Children.toArray(children);

  return (
    <div className={className}>
      {childArray.map((child, index) => (
        <div
          key={index}
          className="min-w-0"
          style={{
            opacity: 0,
            animation: mounted
              ? `${animation} 0.5s ease-out ${delay + index * staggerDelay}ms forwards`
              : "none",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
