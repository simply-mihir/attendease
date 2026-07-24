import Link from "next/link";
import { GraduationCap, BarChart3, Bell, Shield, Flame, Calculator } from "lucide-react";

const features = [
  { icon: GraduationCap, title: "Track Attendance", desc: "Mark present, absent, or late with one tap. Supports bulk marking for busy days." },
  { icon: BarChart3, title: "Smart Analytics", desc: "Heatmaps, trend charts, and per-subject breakdowns so you always know where you stand." },
  { icon: Calculator, title: "Bunk Calculator", desc: "Know exactly how many classes you can skip — or how many you need to recover." },
  { icon: Bell, title: "WhatsApp Reminders", desc: "Get pre-class reminders and danger zone alerts straight to your WhatsApp." },
  { icon: Shield, title: "Danger Alerts", desc: "Instant warnings when your attendance drops near the minimum threshold." },
  { icon: Flame, title: "Streaks & Badges", desc: "Earn achievements for consistent attendance. Keep your streak alive!" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">AttendEase</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text transition">
            Log in
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition">
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Flame className="w-4 h-4" /> Built for students who value their time
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
          Never miss an attendance<br />
          <span className="text-primary">threshold again</span>
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mb-8">
          AttendEase tracks your classes, calculates how many you can skip, warns you before it&apos;s too late,
          and sends reminders right to your WhatsApp. All in one beautiful app.
        </p>
        <div className="flex gap-4">
          <Link href="/register" className="px-8 py-3 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-dark transition shadow-lg shadow-primary/25">
            Get Started — It&apos;s Free
          </Link>
          <Link href="/login" className="px-8 py-3 border border-border rounded-xl font-semibold text-lg hover:bg-surface-2 transition">
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-surface-2">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to stay above the line</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-surface p-6 rounded-xl border border-border hover:shadow-md transition">
                <f.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border text-center text-text-muted text-sm">
        <p>&copy; {new Date().getFullYear()} AttendEase. Built with care for students everywhere.</p>
      </footer>
    </div>
  );
}
