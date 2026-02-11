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
  description: "A food encyclopedia for the curious eater.",
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
          <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <nav className="flex items-center gap-6">
              <a href="/" className="text-lg font-bold text-gray-900">
                SkipTheMid
              </a>
              <a
                href="/map"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Map
              </a>
            </nav>
            <AuthButton />
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
