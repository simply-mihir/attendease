"use client";

interface StreakFlameProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export function StreakFlame({ streak, size = "md" }: StreakFlameProps) {
  if (streak <= 0) return null;

  const sizeClasses = {
    sm: "w-5 h-5 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-lg",
  };

  const flameIntensity =
    streak >= 30
      ? "from-red-500 via-orange-400 to-yellow-300"
      : streak >= 14
      ? "from-orange-500 via-amber-400 to-yellow-300"
      : streak >= 7
      ? "from-amber-500 via-yellow-400 to-yellow-200"
      : "from-yellow-500 via-yellow-400 to-yellow-200";

  return (
    <div className={`relative inline-flex items-center gap-1 ${sizeClasses[size]}`}>
      {/* Animated flame */}
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`${sizeClasses[size]} flame-dance`}
        >
          <defs>
            <linearGradient id={`flame-${streak}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
          </defs>
          <path
            d="M12 2C6.5 8 4 12 4 15.5C4 19.09 7.58 22 12 22C16.42 22 20 19.09 20 15.5C20 12 17.5 8 12 2ZM12 20C8.69 20 6 17.98 6 15.5C6 13.12 7.95 9.91 12 4.88C16.05 9.91 18 13.12 18 15.5C18 17.98 15.31 20 12 20ZM12 18C14.21 18 16 16.66 16 15C16 13.34 14 10.5 12 8C10 10.5 8 13.34 8 15C8 16.66 9.79 18 12 18Z"
            fill={`url(#flame-${streak})`}
          />
        </svg>
        {/* Glow effect */}
        <div className="absolute inset-0 blur-md opacity-50 pointer-events-none">
          <div className={`w-full h-full rounded-full bg-gradient-to-t ${flameIntensity}`} />
        </div>
      </div>
      {/* Streak count */}
      <span className={`font-bold bg-gradient-to-r ${flameIntensity} bg-clip-text text-transparent`}>
        {streak}
      </span>
    </div>
  );
}
