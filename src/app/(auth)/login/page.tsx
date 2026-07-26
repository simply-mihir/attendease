"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Github, Mail } from "lucide-react";
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

  return (
    <div className="glass-strong rounded-3xl p-8 shadow-2xl">
      <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
      <p className="text-text-secondary text-sm mb-6">Sign in to continue tracking your attendance</p>

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

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-text-secondary">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl input-glass text-sm"
            placeholder="you@university.edu" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-text-secondary">Password</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl input-glass text-sm pr-11"
              placeholder="Enter your password" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-text-muted hover:text-text transition">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 btn-gradient rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Sign in with email
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-purple-400 font-medium hover:text-purple-300 transition">Sign up</Link>
      </p>
    </div>
  );
}
