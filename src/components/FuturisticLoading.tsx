"use client";

export default function FuturisticLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gray-950">
      
      {/* === LAYER 1: Animated grid background === */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            animation: "gridScroll 20s linear infinite",
          }}
        />
      </div>

      {/* === LAYER 2: Floating particles === */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-500/20"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatParticle ${Math.random() * 6 + 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* === LAYER 3: Radial glow pulse === */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          animation: "glowPulse 3s ease-in-out infinite",
        }}
      />

      {/* === MAIN CONTENT === */}
      <div className="relative flex flex-col items-center gap-8">
        
        {/* === Logo container with orbital rings === */}
        <div className="relative h-32 w-32">
          
          {/* Outer ring — slow rotation */}
          <div
            className="absolute inset-0 rounded-full border border-purple-500/20"
            style={{ animation: "spinSlow 8s linear infinite" }}
          >
            {/* Dot on ring */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-purple-400 shadow-lg shadow-purple-500/50" />
          </div>

          {/* Middle ring — reverse rotation */}
          <div
            className="absolute inset-3 rounded-full border border-violet-500/15"
            style={{ animation: "spinSlow 6s linear infinite reverse" }}
          >
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-lg shadow-violet-500/50" />
          </div>

          {/* Inner ring — fast rotation */}
          <div
            className="absolute inset-6 rounded-full border border-indigo-500/20"
            style={{ animation: "spinSlow 4s linear infinite" }}
          >
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-lg shadow-indigo-500/50" />
          </div>

          {/* Center icon — breathe animation */}
          <div
            className="absolute inset-9 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-violet-600 shadow-xl shadow-purple-500/30"
            style={{ animation: "breathe 2s ease-in-out infinite" }}
          >
            <span className="text-2xl">🎓</span>
          </div>

          {/* Arc segments — rotating dashed arcs */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 128 128" style={{ animation: "spinSlow 10s linear infinite" }}>
            <circle
              cx="64" cy="64" r="62"
              fill="none"
              stroke="rgba(139,92,246,0.15)"
              strokeWidth="1"
              strokeDasharray="20 40"
              strokeLinecap="round"
            />
          </svg>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 128 128" style={{ animation: "spinSlow 7s linear infinite reverse" }}>
            <circle
              cx="64" cy="64" r="55"
              fill="none"
              stroke="rgba(167,139,250,0.1)"
              strokeWidth="1"
              strokeDasharray="15 30"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* === App name with reveal animation === */}
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-2xl font-bold tracking-wider"
            style={{ animation: "textReveal 1s ease-out forwards" }}
          >
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              ATTENDEASE
            </span>
          </h1>

          {/* Animated underline */}
          <div className="h-px w-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent" style={{ animation: "lineExpand 1.5s ease-out 0.5s forwards" }} />
        </div>

        {/* === Status text with typing effect === */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span style={{ animation: "fadeInUp 0.5s ease-out 0.8s both" }}>Loading your dashboard</span>
          <span className="flex gap-0.5">
            <span className="inline-block h-1 w-1 rounded-full bg-purple-400/60" style={{ animation: "dotBounce 1.4s ease-in-out infinite" }} />
            <span className="inline-block h-1 w-1 rounded-full bg-purple-400/60" style={{ animation: "dotBounce 1.4s ease-in-out 0.2s infinite" }} />
            <span className="inline-block h-1 w-1 rounded-full bg-purple-400/60" style={{ animation: "dotBounce 1.4s ease-in-out 0.4s infinite" }} />
          </span>
        </div>

        {/* === Progress bar === */}
        <div
          className="h-0.5 w-48 overflow-hidden rounded-full bg-white/5"
          style={{ animation: "fadeInUp 0.5s ease-out 1s both" }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500"
            style={{ animation: "progressFill 2.5s ease-in-out infinite" }}
          />
        </div>
      </div>

      {/* === LAYER 4: Scan line effect === */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.1) 2px, rgba(139,92,246,0.1) 4px)",
          animation: "scanLines 8s linear infinite",
        }}
      />
    </div>
  );
}
