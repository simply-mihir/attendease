"use client";

export function VibrantBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">

      {/* ============ DARK MODE BUBBLES ============ */}
      <div className="absolute inset-0 hidden dark:block">
        {/* Base color */}
        <div className="absolute inset-0 bg-[#0a0e1a]" />

        {/* --- ROW 1: TOP --- */}
        {/* Hot pink — top left corner */}
        <div className="absolute -top-16 -left-16 h-[350px] w-[350px] rounded-full bg-[#FF2D78]/20 blur-[100px]" />
        {/* Blue — top center-right */}
        <div className="absolute -top-10 right-[30%] h-[280px] w-[280px] rounded-full bg-[#4361ee]/18 blur-[90px]" />
        {/* Teal — top right corner */}
        <div className="absolute -top-20 -right-10 h-[300px] w-[300px] rounded-full bg-[#06d6a0]/15 blur-[100px]" />

        {/* --- ROW 2: UPPER MIDDLE --- */}
        {/* Purple — left side, 25% down */}
        <div className="absolute top-[20%] -left-10 h-[250px] w-[250px] rounded-full bg-[#9b5de5]/18 blur-[80px]" />
        {/* Orange — center, 30% down */}
        <div className="absolute top-[28%] left-[45%] h-[200px] w-[200px] rounded-full bg-[#ff6b35]/14 blur-[80px]"
          style={{ animation: "bubbleFloat1 25s ease-in-out infinite" }} />
        {/* Pink — right side, 22% down */}
        <div className="absolute top-[22%] right-[10%] h-[220px] w-[220px] rounded-full bg-[#FF2D78]/12 blur-[80px]" />

        {/* --- ROW 3: CENTER --- */}
        {/* Blue — center left, 45% down */}
        <div className="absolute top-[42%] left-[15%] h-[200px] w-[200px] rounded-full bg-[#4361ee]/14 blur-[80px]"
          style={{ animation: "bubbleFloat2 30s ease-in-out 3s infinite" }} />
        {/* Magenta — dead center */}
        <div className="absolute top-[48%] left-[50%] -translate-x-1/2 h-[180px] w-[180px] rounded-full bg-[#f15bb5]/12 blur-[80px]" />
        {/* Teal — center right */}
        <div className="absolute top-[45%] right-[12%] h-[220px] w-[220px] rounded-full bg-[#06d6a0]/14 blur-[80px]"
          style={{ animation: "bubbleFloat3 28s ease-in-out 6s infinite" }} />

        {/* --- ROW 4: LOWER MIDDLE --- */}
        {/* Purple — left side, 65% down */}
        <div className="absolute top-[62%] left-[5%] h-[250px] w-[250px] rounded-full bg-[#9b5de5]/15 blur-[90px]" />
        {/* Yellow — center, 68% down */}
        <div className="absolute top-[68%] left-[40%] h-[180px] w-[180px] rounded-full bg-[#FFD166]/12 blur-[80px]"
          style={{ animation: "bubbleFloat1 22s ease-in-out 8s infinite" }} />
        {/* Pink — right side, 60% down */}
        <div className="absolute top-[60%] right-[8%] h-[230px] w-[230px] rounded-full bg-[#FF2D78]/14 blur-[80px]" />

        {/* --- ROW 5: BOTTOM --- */}
        {/* Orange — bottom left */}
        <div className="absolute -bottom-16 -left-10 h-[300px] w-[300px] rounded-full bg-[#ff6b35]/16 blur-[100px]" />
        {/* Blue — bottom center */}
        <div className="absolute -bottom-10 left-[40%] h-[250px] w-[250px] rounded-full bg-[#4361ee]/14 blur-[90px]"
          style={{ animation: "bubbleFloat2 26s ease-in-out 4s infinite" }} />
        {/* Cyan — bottom right corner */}
        <div className="absolute -bottom-20 -right-10 h-[320px] w-[320px] rounded-full bg-[#4cc9f0]/15 blur-[100px]" />

        {/* --- SMALL ACCENT DOTS (scattered everywhere) --- */}
        <div className="absolute top-[10%] left-[60%] h-[100px] w-[100px] rounded-full bg-[#FF2D78]/10 blur-[50px]"
          style={{ animation: "bubbleFloat3 18s ease-in-out infinite" }} />
        <div className="absolute top-[35%] left-[75%] h-[120px] w-[120px] rounded-full bg-[#06d6a0]/10 blur-[50px]"
          style={{ animation: "bubbleFloat1 20s ease-in-out 2s infinite" }} />
        <div className="absolute top-[55%] left-[25%] h-[100px] w-[100px] rounded-full bg-[#9b5de5]/10 blur-[50px]"
          style={{ animation: "bubbleFloat2 15s ease-in-out 5s infinite" }} />
        <div className="absolute top-[78%] left-[65%] h-[110px] w-[110px] rounded-full bg-[#ff6b35]/10 blur-[50px]"
          style={{ animation: "bubbleFloat3 17s ease-in-out 7s infinite" }} />
        <div className="absolute top-[85%] left-[20%] h-[90px] w-[90px] rounded-full bg-[#4361ee]/10 blur-[50px]"
          style={{ animation: "bubbleFloat1 19s ease-in-out 3s infinite" }} />
        <div className="absolute top-[15%] left-[35%] h-[80px] w-[80px] rounded-full bg-[#FFD166]/8 blur-[40px]"
          style={{ animation: "bubbleFloat2 21s ease-in-out 9s infinite" }} />
      </div>

      {/* ============ LIGHT MODE BUBBLES ============ */}
      <div className="absolute inset-0 dark:hidden">
        {/* Base */}
        <div className="absolute inset-0 bg-[#fafafa]" />

        {/* --- ROW 1: TOP --- */}
        <div className="absolute -top-16 -left-16 h-[350px] w-[350px] rounded-full bg-[#FF2D78]/10 blur-[100px]" />
        <div className="absolute -top-10 right-[30%] h-[280px] w-[280px] rounded-full bg-[#4361ee]/8 blur-[90px]" />
        <div className="absolute -top-20 -right-10 h-[300px] w-[300px] rounded-full bg-[#06d6a0]/8 blur-[100px]" />

        {/* --- ROW 2: UPPER MIDDLE --- */}
        <div className="absolute top-[20%] -left-10 h-[250px] w-[250px] rounded-full bg-[#9b5de5]/8 blur-[80px]" />
        <div className="absolute top-[28%] left-[45%] h-[200px] w-[200px] rounded-full bg-[#ff6b35]/7 blur-[80px]"
          style={{ animation: "bubbleFloat1 25s ease-in-out infinite" }} />
        <div className="absolute top-[22%] right-[10%] h-[220px] w-[220px] rounded-full bg-[#FF2D78]/6 blur-[80px]" />

        {/* --- ROW 3: CENTER --- */}
        <div className="absolute top-[42%] left-[15%] h-[200px] w-[200px] rounded-full bg-[#4361ee]/7 blur-[80px]"
          style={{ animation: "bubbleFloat2 30s ease-in-out 3s infinite" }} />
        <div className="absolute top-[48%] left-[50%] -translate-x-1/2 h-[180px] w-[180px] rounded-full bg-[#f15bb5]/6 blur-[80px]" />
        <div className="absolute top-[45%] right-[12%] h-[220px] w-[220px] rounded-full bg-[#06d6a0]/7 blur-[80px]"
          style={{ animation: "bubbleFloat3 28s ease-in-out 6s infinite" }} />

        {/* --- ROW 4: LOWER MIDDLE --- */}
        <div className="absolute top-[62%] left-[5%] h-[250px] w-[250px] rounded-full bg-[#9b5de5]/7 blur-[90px]" />
        <div className="absolute top-[68%] left-[40%] h-[180px] w-[180px] rounded-full bg-[#FFD166]/7 blur-[80px]"
          style={{ animation: "bubbleFloat1 22s ease-in-out 8s infinite" }} />
        <div className="absolute top-[60%] right-[8%] h-[230px] w-[230px] rounded-full bg-[#FF2D78]/7 blur-[80px]" />

        {/* --- ROW 5: BOTTOM --- */}
        <div className="absolute -bottom-16 -left-10 h-[300px] w-[300px] rounded-full bg-[#ff6b35]/8 blur-[100px]" />
        <div className="absolute -bottom-10 left-[40%] h-[250px] w-[250px] rounded-full bg-[#4361ee]/7 blur-[90px]"
          style={{ animation: "bubbleFloat2 26s ease-in-out 4s infinite" }} />
        <div className="absolute -bottom-20 -right-10 h-[320px] w-[320px] rounded-full bg-[#4cc9f0]/8 blur-[100px]" />

        {/* --- SMALL ACCENT DOTS --- */}
        <div className="absolute top-[10%] left-[60%] h-[100px] w-[100px] rounded-full bg-[#FF2D78]/5 blur-[50px]"
          style={{ animation: "bubbleFloat3 18s ease-in-out infinite" }} />
        <div className="absolute top-[35%] left-[75%] h-[120px] w-[120px] rounded-full bg-[#06d6a0]/5 blur-[50px]"
          style={{ animation: "bubbleFloat1 20s ease-in-out 2s infinite" }} />
        <div className="absolute top-[55%] left-[25%] h-[100px] w-[100px] rounded-full bg-[#9b5de5]/5 blur-[50px]"
          style={{ animation: "bubbleFloat2 15s ease-in-out 5s infinite" }} />
        <div className="absolute top-[78%] left-[65%] h-[110px] w-[110px] rounded-full bg-[#ff6b35]/5 blur-[50px]"
          style={{ animation: "bubbleFloat3 17s ease-in-out 7s infinite" }} />
        <div className="absolute top-[85%] left-[20%] h-[90px] w-[90px] rounded-full bg-[#4361ee]/5 blur-[50px]"
          style={{ animation: "bubbleFloat1 19s ease-in-out 3s infinite" }} />
      </div>
    </div>
  );
}
