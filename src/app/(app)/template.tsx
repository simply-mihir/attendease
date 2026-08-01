export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-[fadeInUp_0.4s_ease-out] h-full">
      {children}
    </div>
  );
}
