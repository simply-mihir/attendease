import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="relative">
        {/* Outer 3D ring */}
        <div className="w-16 h-16 rounded-full border-4 border-dashed animate-spin shadow-[0_4px_0_var(--color-shadow-heavy)]" style={{ borderColor: 'var(--color-primary)' }}></div>
        {/* Inner solid center */}
        <div className="absolute inset-0 m-auto w-8 h-8 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: 'var(--color-pink)', border: '2px solid var(--color-border-heavy)', boxShadow: '0 2px 0 var(--color-shadow-heavy)' }}>
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
      </div>
      <p className="mt-6 text-text font-black uppercase tracking-[0.1em] text-sm animate-pulse">
        Loading...
      </p>
    </div>
  );
}
