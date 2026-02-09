import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import AuthButton from "@/components/ui/AuthButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkipTheMid",
  description: "Find the best dishes. Skip the mid.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold text-gray-900">SkipTheMid</h1>
            <AuthButton />
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
