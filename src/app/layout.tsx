import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Inter({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"],
  display: "swap",
  preload: true
});

const geistMono = JetBrains_Mono({ 
  variable: "--font-geist-mono", 
  subsets: ["latin"],
  display: "swap",
  preload: true
});

export const viewport: Viewport = {
  themeColor: "#0B0F1A",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "AttendEase — Smart Attendance Tracker",
  description: "Track your class attendance, prevent shortages, and get smart reminders.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-surface text-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
