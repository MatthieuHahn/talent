import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../app/output.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Recruiting CRM",
  description: "Powered by Next.js + Tailwind + NestJS backend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-red-500 antialiased bg-[var(--color-bg)] text-gray-900`}
      >
        {children}
      </body>
    </html>
  );
}
