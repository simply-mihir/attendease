import Link from "next/link";
import { GraduationCap, BarChart3, Bell, Shield, Flame, Calculator, ArrowRight, Sparkles } from "lucide-react";

const features = [
  { icon: GraduationCap, title: "Track Attendance", desc: "Mark present, absent, or late with one tap. Supports bulk marking for busy days.", gradient: "from-purple-500 to-pink-500" },
  { icon: BarChart3, title: "Smart Analytics", desc: "Heatmaps, trend charts, and per-subject breakdowns so you always know where you stand.", gradient: "from-cyan-500 to-blue-500" },
  { icon: Calculator, title: "Bunk Calculator", desc: "Know exactly how many classes you can skip — or how many you need to recover.", gradient: "from-orange-500 to-red-500" },
  { icon: Bell, title: "WhatsApp Reminders", desc: "Get pre-class reminders and danger zone alerts straight to your WhatsApp.", gradient: "from-green-500 to-emerald-500" },
  { icon: Shield, title: "Danger Alerts", desc: "Instant warnings when your attendance drops near the minimum threshold.", gradient: "from-red-500 to-pink-500" },
  { icon: Flame, title: "Streaks & Badges", desc: "Earn achievements for consistent attendance. Keep your streak alive!", gradient: "from-yellow-500 to-orange-500" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-mesh-strong">
      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gradient">AttendEase</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost px-5 py-2.5 rounded-xl text-sm">
            Log in
          </Link>
          <Link href="/register" className="btn-gradient px-5 py-2.5 rounded-xl text-sm">
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-purple-500/20 text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300">Built for students who value their time</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-tight mb-6">
          Never miss an<br />
          <span className="text-gradient">attendance threshold</span><br />
          again
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mb-10 leading-relaxed">
          AttendEase tracks your classes, calculates how many you can skip, warns you before it&apos;s too late,
          and sends reminders right to your WhatsApp. All in one beautiful app.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register" className="btn-gradient px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-2 group">
            Get Started — It&apos;s Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="btn-ghost px-8 py-4 rounded-2xl font-semibold text-lg">
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Everything you need to <span className="text-gradient">stay above the line</span>
          </h2>
          <p className="text-text-secondary text-center mb-16 max-w-lg mx-auto">
            Powerful features packed into a beautiful interface, designed specifically for students.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 hover:bg-glass-strong transition-all duration-300 group cursor-default">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 text-center text-text-muted text-sm border-t border-glass-border">
        <p>&copy; {new Date().getFullYear()} AttendEase. Built with care for students everywhere.</p>
      </footer>
    </div>
  );
}
