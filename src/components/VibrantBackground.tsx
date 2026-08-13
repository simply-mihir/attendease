"use client";

export function VibrantBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">

      {/* ============ DARK MODE ============ */}
      <div className="absolute inset-0 hidden dark:block">
        <div className="absolute inset-0 bg-[#0a0e1a]" />
        
        {/* MOBILE FALLBACK (Simplified, lightweight, static to prevent crashes) */}
        <div className="absolute inset-0 md:hidden opacity-40">
          <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-br from-[#FF2D78]/20 to-[#4361ee]/20 blur-[50px]" />
          <div className="absolute bottom-0 right-0 w-full h-[50vh] bg-gradient-to-tl from-[#9b5de5]/20 to-[#06d6a0]/20 blur-[50px]" />
        </div>

        {/* DESKTOP HEAVY ANIMATIONS */}
        <div className="hidden md:block">
          {/* CLUSTER A: Top-left corner */}
          <div className="absolute -top-20 -left-24 h-[400px] w-[400px] rounded-full bg-[#FF2D78]/20 blur-[100px]" />
          <div className="absolute top-10 left-20 h-[200px] w-[200px] rounded-full bg-[#9b5de5]/16 blur-[70px]" style={{ animation: "bubbleFloat1 22s ease-in-out infinite" }} />
          <div className="absolute top-[8%] left-[8%] h-[120px] w-[120px] rounded-full bg-[#ff6b35]/12 blur-[50px]" />

          {/* CLUSTER B: Top-center */}
          <div className="absolute -top-16 left-[30%] h-[300px] w-[300px] rounded-full bg-[#4361ee]/18 blur-[90px]" />
          <div className="absolute top-[5%] left-[40%] h-[180px] w-[180px] rounded-full bg-[#06d6a0]/14 blur-[70px]" style={{ animation: "bubbleFloat3 26s ease-in-out 4s infinite" }} />
          <div className="absolute top-[3%] left-[35%] h-[100px] w-[100px] rounded-full bg-[#FFD166]/10 blur-[50px]" />

          {/* CLUSTER C: Top-right corner */}
          <div className="absolute -top-20 -right-20 h-[380px] w-[380px] rounded-full bg-[#06d6a0]/18 blur-[100px]" />
          <div className="absolute top-[4%] right-[10%] h-[200px] w-[200px] rounded-full bg-[#4cc9f0]/14 blur-[70px]" style={{ animation: "bubbleFloat2 20s ease-in-out 2s infinite" }} />
          <div className="absolute top-16 right-[5%] h-[130px] w-[130px] rounded-full bg-[#FF2D78]/10 blur-[50px]" />

          {/* CLUSTER D: Left edge, 20-35% down */}
          <div className="absolute top-[18%] -left-16 h-[320px] w-[320px] rounded-full bg-[#9b5de5]/18 blur-[90px]" />
          <div className="absolute top-[25%] left-[5%] h-[160px] w-[160px] rounded-full bg-[#f15bb5]/12 blur-[60px]" style={{ animation: "bubbleFloat1 28s ease-in-out 6s infinite" }} />
          <div className="absolute top-[22%] left-[12%] h-[100px] w-[100px] rounded-full bg-[#4361ee]/10 blur-[50px]" />

          {/* CLUSTER E: Center-left, 25-40% */}
          <div className="absolute top-[30%] left-[20%] h-[250px] w-[250px] rounded-full bg-[#ff6b35]/15 blur-[80px]" style={{ animation: "bubbleFloat2 24s ease-in-out infinite" }} />
          <div className="absolute top-[35%] left-[28%] h-[140px] w-[140px] rounded-full bg-[#FFD166]/10 blur-[60px]" />

          {/* CLUSTER F: Center, 30-45% */}
          <div className="absolute top-[32%] left-[45%] h-[280px] w-[280px] rounded-full bg-[#FF2D78]/14 blur-[90px]" style={{ animation: "bubbleFloat3 30s ease-in-out 3s infinite" }} />
          <div className="absolute top-[38%] left-[52%] h-[150px] w-[150px] rounded-full bg-[#4cc9f0]/12 blur-[60px]" />
          <div className="absolute top-[42%] left-[48%] h-[100px] w-[100px] rounded-full bg-[#06d6a0]/10 blur-[50px]" />

          {/* CLUSTER G: Right edge, 25-40% */}
          <div className="absolute top-[25%] -right-10 h-[300px] w-[300px] rounded-full bg-[#4361ee]/16 blur-[90px]" />
          <div className="absolute top-[30%] right-[8%] h-[180px] w-[180px] rounded-full bg-[#9b5de5]/12 blur-[70px]" style={{ animation: "bubbleFloat1 25s ease-in-out 5s infinite" }} />
          <div className="absolute top-[33%] right-[15%] h-[110px] w-[110px] rounded-full bg-[#ff6b35]/10 blur-[50px]" />

          {/* CLUSTER H: Left, 50-65% */}
          <div className="absolute top-[50%] -left-10 h-[300px] w-[300px] rounded-full bg-[#06d6a0]/16 blur-[90px]" />
          <div className="absolute top-[55%] left-[8%] h-[170px] w-[170px] rounded-full bg-[#FF2D78]/12 blur-[60px]" style={{ animation: "bubbleFloat2 27s ease-in-out 7s infinite" }} />
          <div className="absolute top-[52%] left-[14%] h-[100px] w-[100px] rounded-full bg-[#FFD166]/10 blur-[50px]" />

          {/* CLUSTER I: Center, 50-65% */}
          <div className="absolute top-[52%] left-[35%] h-[260px] w-[260px] rounded-full bg-[#9b5de5]/14 blur-[80px]" style={{ animation: "bubbleFloat3 23s ease-in-out 1s infinite" }} />
          <div className="absolute top-[58%] left-[45%] h-[160px] w-[160px] rounded-full bg-[#f15bb5]/10 blur-[60px]" />

          {/* CLUSTER J: Right, 50-65% */}
          <div className="absolute top-[48%] -right-16 h-[320px] w-[320px] rounded-full bg-[#ff6b35]/16 blur-[90px]" />
          <div className="absolute top-[55%] right-[10%] h-[180px] w-[180px] rounded-full bg-[#4361ee]/12 blur-[70px]" style={{ animation: "bubbleFloat1 29s ease-in-out 8s infinite" }} />
          <div className="absolute top-[53%] right-[18%] h-[100px] w-[100px] rounded-full bg-[#06d6a0]/10 blur-[50px]" />

          {/* CLUSTER K: Left, 70-85% */}
          <div className="absolute top-[70%] -left-16 h-[300px] w-[300px] rounded-full bg-[#4361ee]/16 blur-[90px]" />
          <div className="absolute top-[75%] left-[10%] h-[160px] w-[160px] rounded-full bg-[#FF2D78]/12 blur-[60px]" style={{ animation: "bubbleFloat3 21s ease-in-out 3s infinite" }} />

          {/* CLUSTER L: Center-bottom, 70-85% */}
          <div className="absolute top-[72%] left-[38%] h-[250px] w-[250px] rounded-full bg-[#ff6b35]/14 blur-[80px]" style={{ animation: "bubbleFloat2 26s ease-in-out 5s infinite" }} />
          <div className="absolute top-[78%] left-[50%] h-[150px] w-[150px] rounded-full bg-[#4cc9f0]/12 blur-[60px]" />

          {/* CLUSTER M: Right, 70-85% */}
          <div className="absolute top-[68%] -right-10 h-[300px] w-[300px] rounded-full bg-[#9b5de5]/16 blur-[90px]" />
          <div className="absolute top-[75%] right-[12%] h-[170px] w-[170px] rounded-full bg-[#06d6a0]/12 blur-[60px]" style={{ animation: "bubbleFloat1 24s ease-in-out 9s infinite" }} />

          {/* CLUSTER N: Bottom-left corner */}
          <div className="absolute -bottom-24 -left-20 h-[400px] w-[400px] rounded-full bg-[#f15bb5]/18 blur-[100px]" />
          <div className="absolute bottom-[5%] left-[10%] h-[180px] w-[180px] rounded-full bg-[#ff6b35]/12 blur-[70px]" />

          {/* CLUSTER O: Bottom-center */}
          <div className="absolute -bottom-20 left-[35%] h-[350px] w-[350px] rounded-full bg-[#4361ee]/16 blur-[100px]" />
          <div className="absolute bottom-[3%] left-[45%] h-[160px] w-[160px] rounded-full bg-[#FFD166]/12 blur-[60px]" style={{ animation: "bubbleFloat2 23s ease-in-out 6s infinite" }} />

          {/* CLUSTER P: Bottom-right corner */}
          <div className="absolute -bottom-24 -right-20 h-[400px] w-[400px] rounded-full bg-[#FF2D78]/18 blur-[100px]" />
          <div className="absolute bottom-[8%] right-[8%] h-[180px] w-[180px] rounded-full bg-[#9b5de5]/12 blur-[70px]" style={{ animation: "bubbleFloat3 25s ease-in-out 2s infinite" }} />
        </div>
      </div>

      {/* ============ LIGHT MODE ============ */}
      <div className="absolute inset-0 dark:hidden">
        <div className="absolute inset-0 bg-[#fafafa]" />
        
        {/* MOBILE FALLBACK */}
        <div className="absolute inset-0 md:hidden opacity-30">
          <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-br from-[#FF2D78]/10 to-[#4361ee]/10 blur-[50px]" />
          <div className="absolute bottom-0 right-0 w-full h-[50vh] bg-gradient-to-tl from-[#9b5de5]/10 to-[#06d6a0]/10 blur-[50px]" />
        </div>

        {/* DESKTOP HEAVY ANIMATIONS */}
        <div className="hidden md:block">
          {/* CLUSTER A */}
          <div className="absolute -top-20 -left-24 h-[400px] w-[400px] rounded-full bg-[#FF2D78]/10 blur-[100px]" />
          <div className="absolute top-10 left-20 h-[200px] w-[200px] rounded-full bg-[#9b5de5]/8 blur-[70px]" style={{ animation: "bubbleFloat1 22s ease-in-out infinite" }} />
          <div className="absolute top-[8%] left-[8%] h-[120px] w-[120px] rounded-full bg-[#ff6b35]/6 blur-[50px]" />

          {/* CLUSTER B */}
          <div className="absolute -top-16 left-[30%] h-[300px] w-[300px] rounded-full bg-[#4361ee]/8 blur-[90px]" />
          <div className="absolute top-[5%] left-[40%] h-[180px] w-[180px] rounded-full bg-[#06d6a0]/7 blur-[70px]" style={{ animation: "bubbleFloat3 26s ease-in-out 4s infinite" }} />

          {/* CLUSTER C */}
          <div className="absolute -top-20 -right-20 h-[380px] w-[380px] rounded-full bg-[#06d6a0]/8 blur-[100px]" />
          <div className="absolute top-[4%] right-[10%] h-[200px] w-[200px] rounded-full bg-[#4cc9f0]/7 blur-[70px]" style={{ animation: "bubbleFloat2 20s ease-in-out 2s infinite" }} />

          {/* CLUSTER D */}
          <div className="absolute top-[18%] -left-16 h-[320px] w-[320px] rounded-full bg-[#9b5de5]/8 blur-[90px]" />
          <div className="absolute top-[25%] left-[5%] h-[160px] w-[160px] rounded-full bg-[#f15bb5]/6 blur-[60px]" style={{ animation: "bubbleFloat1 28s ease-in-out 6s infinite" }} />

          {/* CLUSTER E */}
          <div className="absolute top-[30%] left-[20%] h-[250px] w-[250px] rounded-full bg-[#ff6b35]/7 blur-[80px]" style={{ animation: "bubbleFloat2 24s ease-in-out infinite" }} />

          {/* CLUSTER F */}
          <div className="absolute top-[32%] left-[45%] h-[280px] w-[280px] rounded-full bg-[#FF2D78]/7 blur-[90px]" style={{ animation: "bubbleFloat3 30s ease-in-out 3s infinite" }} />
          <div className="absolute top-[38%] left-[52%] h-[150px] w-[150px] rounded-full bg-[#4cc9f0]/6 blur-[60px]" />

          {/* CLUSTER G */}
          <div className="absolute top-[25%] -right-10 h-[300px] w-[300px] rounded-full bg-[#4361ee]/8 blur-[90px]" />
          <div className="absolute top-[30%] right-[8%] h-[180px] w-[180px] rounded-full bg-[#9b5de5]/6 blur-[70px]" style={{ animation: "bubbleFloat1 25s ease-in-out 5s infinite" }} />

          {/* CLUSTER H */}
          <div className="absolute top-[50%] -left-10 h-[300px] w-[300px] rounded-full bg-[#06d6a0]/8 blur-[90px]" />
          <div className="absolute top-[55%] left-[8%] h-[170px] w-[170px] rounded-full bg-[#FF2D78]/6 blur-[60px]" style={{ animation: "bubbleFloat2 27s ease-in-out 7s infinite" }} />

          {/* CLUSTER I */}
          <div className="absolute top-[52%] left-[35%] h-[260px] w-[260px] rounded-full bg-[#9b5de5]/7 blur-[80px]" style={{ animation: "bubbleFloat3 23s ease-in-out 1s infinite" }} />

          {/* CLUSTER J */}
          <div className="absolute top-[48%] -right-16 h-[320px] w-[320px] rounded-full bg-[#ff6b35]/8 blur-[90px]" />
          <div className="absolute top-[55%] right-[10%] h-[180px] w-[180px] rounded-full bg-[#4361ee]/6 blur-[70px]" style={{ animation: "bubbleFloat1 29s ease-in-out 8s infinite" }} />

          {/* CLUSTER K */}
          <div className="absolute top-[70%] -left-16 h-[300px] w-[300px] rounded-full bg-[#4361ee]/8 blur-[90px]" />
          <div className="absolute top-[75%] left-[10%] h-[160px] w-[160px] rounded-full bg-[#FF2D78]/6 blur-[60px]" style={{ animation: "bubbleFloat3 21s ease-in-out 3s infinite" }} />

          {/* CLUSTER L */}
          <div className="absolute top-[72%] left-[38%] h-[250px] w-[250px] rounded-full bg-[#ff6b35]/7 blur-[80px]" style={{ animation: "bubbleFloat2 26s ease-in-out 5s infinite" }} />

          {/* CLUSTER M */}
          <div className="absolute top-[68%] -right-10 h-[300px] w-[300px] rounded-full bg-[#9b5de5]/8 blur-[90px]" />
          <div className="absolute top-[75%] right-[12%] h-[170px] w-[170px] rounded-full bg-[#06d6a0]/6 blur-[60px]" style={{ animation: "bubbleFloat1 24s ease-in-out 9s infinite" }} />

          {/* CLUSTER N */}
          <div className="absolute -bottom-24 -left-20 h-[400px] w-[400px] rounded-full bg-[#f15bb5]/8 blur-[100px]" />

          {/* CLUSTER O */}
          <div className="absolute -bottom-20 left-[35%] h-[350px] w-[350px] rounded-full bg-[#4361ee]/8 blur-[100px]" />
          <div className="absolute bottom-[3%] left-[45%] h-[160px] w-[160px] rounded-full bg-[#FFD166]/6 blur-[60px]" style={{ animation: "bubbleFloat2 23s ease-in-out 6s infinite" }} />

          {/* CLUSTER P */}
          <div className="absolute -bottom-24 -right-20 h-[400px] w-[400px] rounded-full bg-[#FF2D78]/8 blur-[100px]" />
          <div className="absolute bottom-[8%] right-[8%] h-[180px] w-[180px] rounded-full bg-[#9b5de5]/6 blur-[70px]" style={{ animation: "bubbleFloat3 25s ease-in-out 2s infinite" }} />
        </div>
    </div>
  );
}
