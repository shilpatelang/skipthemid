import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
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

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://skipthemid.com"),
  title: "SkipTheMid",
  description: "A food encyclopedia for the curious eater.",
  openGraph: {
    title: "SkipTheMid",
    description: "A food encyclopedia for the curious eater.",
    siteName: "SkipTheMid",
    type: "website",
    images: [{ url: "/og-image.jpg", alt: "SkipTheMid" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkipTheMid",
    description: "A food encyclopedia for the curious eater.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <Providers>
          <AuthButton />
          {children}
        </Providers>
      </body>
    </html>
  );
}
