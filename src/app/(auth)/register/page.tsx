"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Github, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.fullName, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      // Auto sign in after register
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
      
      {/* === ANIMATED BACKGROUND === */}
      
      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.05]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            animation: "gridScroll 20s linear infinite",
          }}
        />
      </div>

      {/* Large orbital decoration — top right */}
      <div className="absolute -top-32 -right-32 h-96 w-96 opacity-20">
        <div className="absolute inset-0 rounded-full border border-purple-500/30" style={{ animation: "spinSlow 20s linear infinite" }}>
          <div className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-purple-400/50" />
        </div>
        <div className="absolute inset-8 rounded-full border border-violet-500/20" style={{ animation: "spinSlow 15s linear infinite reverse" }} />
        <div className="absolute inset-16 rounded-full border border-indigo-500/15" style={{ animation: "spinSlow 12s linear infinite" }} />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 384 384" style={{ animation: "spinSlow 25s linear infinite" }}>
          <circle cx="192" cy="192" r="180" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="1" strokeDasharray="30 50" />
        </svg>
      </div>

      {/* Large orbital decoration — bottom left */}
      <div className="absolute -bottom-24 -left-24 h-72 w-72 opacity-15">
        <div className="absolute inset-0 rounded-full border border-indigo-500/30" style={{ animation: "spinSlow 18s linear infinite reverse" }}>
          <div className="absolute -right-1 top-1/2 h-2 w-2 rounded-full bg-indigo-400/50" />
        </div>
        <div className="absolute inset-6 rounded-full border border-purple-500/20" style={{ animation: "spinSlow 14s linear infinite" }} />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 288 288" style={{ animation: "spinSlow 22s linear infinite reverse" }}>
          <circle cx="144" cy="144" r="138" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="1" strokeDasharray="25 45" />
        </svg>
      </div>

      {/* Floating particles */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-purple-500/20"
              style={{
                width: `${Math.random() * 3 + 2}px`,
                height: `${Math.random() * 3 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `floatParticle ${Math.random() * 6 + 5}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-600/5 blur-3xl" style={{ animation: "glowDrift 12s ease-in-out infinite" }} />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-600/5 blur-3xl" style={{ animation: "glowDrift 10s ease-in-out infinite reverse" }} />

      {/* Scan lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.1) 2px, rgba(139,92,246,0.1) 4px)" }} />

      {/* === MAIN CONTENT === */}
      <div className="relative z-10 w-full max-w-md px-6">
        
        {/* Logo + Title — animated entrance */}
        <div className="flex flex-col items-center mb-10" style={{ animation: "fadeInUp 0.8s ease-out" }}>
          {/* Animated logo */}
          <div className="relative h-20 w-20 mb-6">
            <div className="absolute inset-0 rounded-full border border-purple-500/25" style={{ animation: "spinSlow 8s linear infinite" }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-purple-400 shadow-lg shadow-purple-500/50" />
            </div>
            <div className="absolute inset-2 rounded-full border border-violet-500/15" style={{ animation: "spinSlow 5s linear infinite reverse" }} />
            <div className="absolute inset-5 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-violet-600 shadow-xl shadow-purple-500/30" style={{ animation: "breathe 2.5s ease-in-out infinite" }}>
              <span className="text-2xl">🎓</span>
            </div>
          </div>

          {/* App name */}
          <h1 className="text-3xl font-bold tracking-wider mb-2" style={{ animation: "textReveal 1s ease-out forwards" }}>
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              ATTENDEASE
            </span>
          </h1>
          <div className="h-px w-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent" style={{ animation: "lineExpand 1.5s ease-out 0.3s forwards" }} />
          <p className="text-gray-500 text-sm mt-3" style={{ animation: "fadeInUp 0.6s ease-out 0.5s both" }}>
            Smart Attendance Tracking for Students
          </p>
        </div>

        {/* Register Card — glassmorphic */}
        <div
          className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-purple-500/5"
          style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}
        >
          {/* Gradient line at top of card */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent rounded-t-2xl" />
          
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-text-secondary text-sm mb-6">Start tracking your attendance in under a minute</p>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="btn-ghost py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:border-red-500/30">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 5c1.61 0 3.08.55 4.23 1.46L19.54 3.2A11.96 11.96 0 0 0 12 0 12 12 0 0 0 1.21 6.53l4.06 3.23Z"/>
                <path fill="#34A853" d="M16.04 18.01A7.05 7.05 0 0 1 12 19.08c-2.92 0-5.44-1.78-6.52-4.32l-4.06 3.13A12 12 0 0 0 12 24c3.05 0 5.82-1.13 7.94-2.98l-3.9-3.01Z"/>
                <path fill="#4A90D9" d="M19.94 21.02A11.86 11.86 0 0 0 24 12.21c0-.87-.09-1.57-.22-2.29H12v4.64h6.74a5.81 5.81 0 0 1-2.5 3.77l3.7 2.69Z"/>
                <path fill="#FBBC05" d="M5.48 14.76a7.18 7.18 0 0 1-.21-1.72c0-.62.08-1.22.21-1.8L1.42 8.01A12 12 0 0 0 0 12c0 1.92.46 3.74 1.27 5.34l4.21-2.58Z"/>
              </svg>
              Google
            </button>
            <button onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="btn-ghost py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:border-purple-500/30">
              <Github className="w-4 h-4" /> GitHub
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-glass-border" />
            <span className="text-text-muted text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-glass-border" />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-secondary">Full Name</label>
              <input type="text" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required
                className="w-full px-4 py-3 rounded-xl input-glass text-sm" placeholder="Prateek Raushan" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-secondary">Email</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required
                className="w-full px-4 py-3 rounded-xl input-glass text-sm" placeholder="you@university.edu" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-secondary">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl input-glass text-sm pr-11" placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-text-muted">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-secondary">Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required
                className="w-full px-4 py-3 rounded-xl input-glass text-sm" placeholder="Repeat your password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 btn-gradient rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create account
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account? <Link href="/login" className="text-purple-400 font-medium hover:text-purple-300 transition">Sign in</Link>
          </p>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-gray-600 mt-6" style={{ animation: "fadeInUp 0.6s ease-out 0.8s both" }}>
          Track attendance. Stay on track. Graduate with confidence.
        </p>
      </div>
    </div>
  );
}
