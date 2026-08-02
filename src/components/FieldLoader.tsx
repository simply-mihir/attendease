export function FieldLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-[2px]",
    md: "h-6 w-6 border-[2px]",
    lg: "h-8 w-8 border-[3px]",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-[#FF2D78]/30 border-t-[#FF2D78] animate-spin`}
    />
  );
}
