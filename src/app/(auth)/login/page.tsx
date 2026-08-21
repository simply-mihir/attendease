"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Github, Mail , GraduationCap } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) throw new Error("Invalid email or password");
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      
      {/* === DECORATIVE OVERLAYS (orbitals + particles) === */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">

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
      </div>

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
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
          </div>
          
          {/* App name */}
          <h1 className="text-3xl font-black tracking-wider mb-2" style={{ animation: "textReveal 1s ease-out forwards" }}>
            <span className="bg-gradient-to-r from-[#FF2D78] via-[#a855f7] to-[#06d6a0] bg-clip-text text-transparent">
              ATTENDEASE
            </span>
          </h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-[#FF2D78] to-[#06d6a0] rounded-full" style={{ animation: "lineExpand 1.5s ease-out 0.3s forwards" }} />
          <p className="text-[#a0a0b8] text-sm mt-3 font-semibold" style={{ animation: "fadeInUp 0.6s ease-out 0.5s both" }}>
            Smart Attendance Tracking for Students
          </p>
        </div>

        {/* Modal */}
        <div 
          className="rounded-2xl border-2 border-[#2a2a3d] bg-[#141425] p-8 shadow-[0_10px_0_0_#0d0d1a]"
          style={{ animation: "scaleIn 0.5s ease-out 0.2s both" }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Welcome back</h2>
            <p className="text-[#a0a0b8] text-sm font-bold">Sign in to continue tracking your attendance</p>
          </div>

          {/* Glassmorphic label */}
          <div className="relative mb-4 flex justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 blur-xl animate-pulse" />
            <div className="relative px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase drop-shadow-md">Sign in with</span>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="flex-1 py-3 btn-3d-secondary rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            
            <button onClick={() => signIn("github", { callbackUrl: "/dashboard" })} className="flex-1 py-3 bg-[#24292e] hover:bg-[#2f363d] active:translate-y-[2px] active:shadow-[0_0_0_0_#1b1f23] border-2 border-[#1b1f23] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-[0_4px_0_0_#1b1f23]">
              <Github className="w-5 h-5" />
              GitHub
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6 mt-6">
            <div className="flex-1 h-0.5 bg-[#2a2a3d]" />
            <span className="text-[#6b6b80] text-xs uppercase font-bold tracking-wider">or</span>
            <div className="flex-1 h-0.5 bg-[#2a2a3d]" />
          </div>

          {error && (
            <div className="bg-[#ef476f]/15 border-2 border-[#ef476f]/40 text-[#ef476f] text-sm p-3 rounded-xl mb-4 font-bold shadow-[0_3px_0_0_#9e1a38]">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
            <div className="relative group">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="input-3d w-full text-sm"
              />
            </div>
            
            <div className="relative group">
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input-3d w-full text-sm pr-11"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3.5 text-[#6b6b80] hover:text-white transition cursor-pointer">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button disabled={loading} type="submit" 
              className="w-full py-3 btn-3d-primary rounded-xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Sign in with email
            </button>
          </form>

          <p className="text-center text-sm text-[#a0a0b8] font-medium mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#FF2D78] font-bold hover:underline transition">Sign up</Link>
          </p>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-gray-500 font-semibold mt-6" style={{ animation: "fadeInUp 0.6s ease-out 0.8s both" }}>
          Track attendance. Stay on track. Graduate with confidence.
        </p>
      </div>
    </main>
  );
}
