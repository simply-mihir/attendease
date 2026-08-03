"use client";
import { useState } from "react";
import clsx from "clsx";

const DICEBEAR_STYLES = [
  "bottts-neutral",
  "fun-emoji",
  "pixel-art-neutral",
  "shapes",
  "identicon",
  "thumbs",
] as const;

export type AvatarStyle = (typeof DICEBEAR_STYLES)[number];

function getAvatarUrl(seed: string, style: AvatarStyle = "bottts-neutral"): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

function isOAuthImage(url: string): boolean {
  return (
    url.startsWith("https://lh3.googleusercontent.com") ||
    url.startsWith("https://avatars.githubusercontent.com") ||
    url.startsWith("data:image") ||
    url.startsWith("https://")
  );
}

interface UserAvatarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallbackInitial?: boolean;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-16 h-16 text-2xl",
  xl: "w-20 h-20 text-3xl",
};

export function UserAvatar({ user, size = "md", className, showFallbackInitial = true }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const seed = user.email || user.name || "default";
  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();

  // If user has an image set (OAuth or chosen avatar)
  const imageUrl = user.image && !imgError ? user.image : null;
  // Fallback: DiceBear avatar
  const fallbackUrl = getAvatarUrl(seed);

  const src = imageUrl || fallbackUrl;

  return (
    <div
      className={clsx(
        "rounded-xl overflow-hidden flex items-center justify-center shrink-0 border-2 border-[#FF2D78]/30 bg-[#FF2D78]/10",
        sizeMap[size],
        className
      )}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={user.name || "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : showFallbackInitial ? (
        <span className="font-black text-[#FF2D78]">{initial}</span>
      ) : null}
    </div>
  );
}

// Avatar picker for settings
interface AvatarPickerProps {
  seed: string;
  currentImage?: string | null;
  onSelect: (url: string) => void;
}

export function AvatarPicker({ seed, currentImage, onSelect }: AvatarPickerProps) {
  const [selected, setSelected] = useState<string | null>(currentImage || null);

  const options = DICEBEAR_STYLES.map((style) => ({
    style,
    url: getAvatarUrl(seed, style),
    label: style
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  }));

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#c4c4d4]">Choose your avatar style</p>
      <div className="grid grid-cols-3 gap-3">
        {options.map((opt) => (
          <button
            key={opt.style}
            type="button"
            onClick={() => {
              setSelected(opt.url);
              onSelect(opt.url);
            }}
            className={clsx(
              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer",
              selected === opt.url
                ? "border-[#FF2D78] bg-[#FF2D78]/10 shadow-[0_3px_0_0_#cc1a5e]"
                : "border-gray-200 dark:border-[#2a2a3d] hover:border-[#FF2D78]/50 shadow-[0_3px_0_0_#d1d5db] dark:shadow-[0_3px_0_0_#0d0d1a]"
            )}
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-[#1f1f35]">
              <img
                src={opt.url}
                alt={opt.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="text-[10px] font-bold text-[#4a4a5a] dark:text-[#c4c4d4] truncate w-full text-center">
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { DICEBEAR_STYLES, getAvatarUrl };
