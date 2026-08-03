"use client";
import { useState, useRef } from "react";
import clsx from "clsx";
import { Upload } from "lucide-react";
import { DICEBEAR_STYLES, getAvatarUrl, generateRandomAvatar, type AvatarStyle } from "@/lib/avatar-utils";

// Re-export so existing imports from this file keep working
export { DICEBEAR_STYLES, getAvatarUrl, generateRandomAvatar, type AvatarStyle };

const STYLE_LABELS: Record<AvatarStyle, string> = {
  "bottts-neutral": "Robots",
  "fun-emoji": "Emoji",
  "pixel-art-neutral": "Pixel Art",
  "shapes": "Shapes",
  "identicon": "Identicon",
  "thumbs": "Thumbs",
  "rings": "Rings",
  "glass": "Glass",
  "initials": "Initials",
  "notionists-neutral": "Notion",
  "adventurer-neutral": "Adventure",
  "big-ears-neutral": "Big Ears",
  "lorelei-neutral": "Lorelei",
  "dylan": "Dylan",
};

// ─── Avatar display component ───
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

  const imageUrl = user.image && !imgError ? user.image : null;
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

// ─── Avatar picker (styles grid + photo upload) ───
interface AvatarPickerProps {
  seed: string;
  currentImage?: string | null;
  onSelect: (url: string) => void;
}

/** Resize an image file to max 256×256 and return a base64 data URL */
function resizeImage(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > h) { h = Math.round((h / w) * maxSize); w = maxSize; }
        else { w = Math.round((w / h) * maxSize); h = maxSize; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/webp", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AvatarPicker({ seed, currentImage, onSelect }: AvatarPickerProps) {
  const [selected, setSelected] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const options = DICEBEAR_STYLES.map((style) => ({
    style,
    url: getAvatarUrl(seed, style),
    label: STYLE_LABELS[style],
  }));

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImage(file);
      setSelected(dataUrl);
      onSelect(dataUrl);
    } catch (err) {
      console.error("Failed to process image", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-[#4a4a5a] dark:text-[#c4c4d4]">Choose avatar or upload photo</p>

      {/* Upload button */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className={clsx(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-xs font-bold transition-all duration-150 cursor-pointer",
          selected?.startsWith("data:image")
            ? "border-[#FF2D78] bg-[#FF2D78]/10 text-[#FF2D78] shadow-[0_3px_0_0_#cc1a5e]"
            : "border-gray-300 dark:border-[#2a2a3d] text-[#4a4a5a] dark:text-[#c4c4d4] hover:border-[#FF2D78]/50 shadow-[0_3px_0_0_#d1d5db] dark:shadow-[0_3px_0_0_#0d0d1a]"
        )}
      >
        {uploading ? (
          <span className="animate-spin w-4 h-4 border-2 border-[#FF2D78] border-t-transparent rounded-full" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {uploading ? "Processing..." : "Upload your own photo"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Avatar grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {options.map((opt) => (
          <button
            key={opt.style}
            type="button"
            onClick={() => {
              setSelected(opt.url);
              onSelect(opt.url);
            }}
            className={clsx(
              "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-150 cursor-pointer",
              selected === opt.url
                ? "border-[#FF2D78] bg-[#FF2D78]/10 shadow-[0_3px_0_0_#cc1a5e]"
                : "border-gray-200 dark:border-[#2a2a3d] hover:border-[#FF2D78]/50 shadow-[0_2px_0_0_#d1d5db] dark:shadow-[0_2px_0_0_#0d0d1a]"
            )}
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-[#1f1f35]">
              <img
                src={opt.url}
                alt={opt.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="text-[9px] font-bold text-[#4a4a5a] dark:text-[#c4c4d4] truncate w-full text-center leading-tight">
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
