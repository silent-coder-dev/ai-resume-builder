import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClientInit } from "@/components/shell/ClientInit";
import "./globals.css";

// PRD §5.2: Inter throughout the application UI.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "AI Resume Studio — Free ATS-friendly resume builder",
  description:
    "Create professional, ATS-friendly resumes with AI writing help, GitHub project import, job matching, and free PDF export. No sign-up needed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas font-sans text-body text-ink">
        {children}
        <ClientInit />
      </body>
    </html>
  );
}
