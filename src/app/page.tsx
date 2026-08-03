import Link from "next/link";
import { GraduationCap, BarChart3, Bell, Shield, Flame, Calculator, ArrowRight, Sparkles } from "lucide-react";

const features = [
  { icon: GraduationCap, title: "Track Attendance", desc: "Mark present, absent, or late with one tap. Supports bulk marking for busy days.", color: "#a855f7", glow: "rgba(168,85,247,0.25)" },
  { icon: BarChart3, title: "Smart Analytics", desc: "Heatmaps, trend charts, and per-subject breakdowns so you always know where you stand.", color: "#06b6d4", glow: "rgba(6,182,212,0.25)" },
  { icon: Calculator, title: "Bunk Calculator", desc: "Know exactly how many classes you can skip — or how many you need to recover.", color: "#f97316", glow: "rgba(249,115,22,0.25)" },
  { icon: Bell, title: "Telegram & Email Alerts", desc: "Get pre-class reminders, daily briefs, and danger zone alerts via Telegram Bot or Email.", color: "#10b981", glow: "rgba(16,185,129,0.25)" },
  { icon: Shield, title: "Danger Alerts", desc: "Instant warnings when your attendance drops near the minimum threshold.", color: "#ef4444", glow: "rgba(239,68,68,0.25)" },
  { icon: Flame, title: "Streaks & Badges", desc: "Earn achievements for consistent attendance. Keep your streak alive!", color: "#eab308", glow: "rgba(234,179,8,0.25)" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7] dark:bg-[#0b0b14] text-[#1a1a2e] dark:text-white">
      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#7b2cbf]/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-[#00b4d8]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-[#ff2d78]/10 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-[#7b2cbf] border-2 border-[#5a189a] flex items-center justify-center shadow-[0_3px_0_0_#5a189a]">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-[#ff2d78] via-[#7b2cbf] to-[#00b4d8] bg-clip-text text-transparent">
            AttendEase
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/login" className="nav-btn-secondary">
            Log in
          </Link>
          <Link href="/register" className="nav-btn-primary">
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full card-3d text-xs font-black mb-8 border-2 border-[#7b2cbf] text-[#7b2cbf] dark:text-[#a855f7] bg-[#7b2cbf]/10">
          <Sparkles className="w-4 h-4 text-[#7b2cbf] dark:text-[#a855f7]" />
          <span>Built for students who value their time</span>
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight mb-6">
          Never miss an<br />
          <span className="bg-gradient-to-r from-[#ff2d78] via-[#7b2cbf] to-[#00b4d8] bg-clip-text text-transparent">
            attendance threshold
          </span><br />
          again
        </h1>
        <p className="text-base sm:text-lg text-[#4a4a5a] dark:text-[#a0a0b8] font-bold max-w-2xl mb-10 leading-relaxed">
          AttendEase tracks your classes, calculates how many you can skip, warns you before it&apos;s too late,
          and sends reminders right to Telegram and Email. All in one powerful app.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
          <Link href="/register" className="hero-btn-primary group w-full sm:w-auto justify-center">
            Get Started — It&apos;s Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="hero-btn-secondary w-full sm:w-auto text-center">
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4 tracking-tight">
            Everything you need to <span className="text-[#06d6a0]">stay above the line</span>
          </h2>
          <p className="text-[#4a4a5a] dark:text-[#a0a0b8] font-bold text-center mb-16 max-w-lg mx-auto text-sm sm:text-base">
            Powerful features packed into an intuitive 3D interface, designed specifically for students.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="feature-glass-card group cursor-default"
                style={{ "--feature-color": f.color, "--feature-glow": f.glow } as React.CSSProperties}
              >
                {/* Gradient glow behind card on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"
                  style={{ background: f.glow }}
                />

                {/* Colored top accent bar */}
                <div className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: f.color }} />

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border border-white/20 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300"
                  style={{ background: `linear-gradient(135deg, ${f.color}, ${f.color}cc)`, boxShadow: `0 4px 15px ${f.glow}` }}
                >
                  <f.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-lg font-black mb-2 text-[#1a1a2e] dark:text-white">{f.title}</h3>
                <p className="text-[#4a4a5a] dark:text-[#a0a0b8] text-sm font-bold leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 text-center text-[#4a4a5a] dark:text-[#6b6b80] text-sm font-bold border-t-2 border-gray-200 dark:border-[#2a2a3d]">
        <p>&copy; {new Date().getFullYear()} AttendEase. Built with care for students everywhere.</p>
      </footer>
    </div>
  );
}
