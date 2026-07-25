import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AttendEase — Smart Attendance Tracker",
  description: "Track your class attendance, prevent shortages, and get smart reminders.",
  manifest: "/manifest.json",
  themeColor: "#7C3AED",
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
