"use client";

import { useEffect, useState, ReactNode, Children } from "react";

type TransitionDirection = "up" | "down" | "left" | "right" | "scale" | "fade";

interface PageTransitionProps {
  children: ReactNode;
  direction?: TransitionDirection;
  staggerChildren?: boolean;
  staggerDelay?: number;
  className?: string;
}

const directionKeyframes: Record<TransitionDirection, string> = {
  up: "pageEnterUp",
  down: "pageEnterDown",
  left: "pageEnterLeft",
  right: "pageEnterRight",
  scale: "pageEnterScale",
  fade: "pageEnterFade",
};

export function PageTransition({
  children,
  direction = "up",
  staggerChildren = true,
  staggerDelay = 80,
  className = "",
}: PageTransitionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  if (!staggerChildren) {
    return (
      <div
        className={className}
        style={{
          opacity: mounted ? 1 : 0,
          animation: mounted ? `${directionKeyframes[direction]} 0.5s ease-out forwards` : "none",
        }}
      >
        {children}
      </div>
    );
  }

  // Stagger: wrap each direct child with a delay
  const childArray = Children.toArray(children);

  return (
    <div className={className}>
      {childArray.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: 0,
            animation: mounted
              ? `${directionKeyframes[direction]} 0.5s ease-out ${index * staggerDelay}ms forwards`
              : "none",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
