import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-teal-400/30 bg-teal-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Wordmark with round logo */}
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/icon.png"
            alt="SkipTheMid logo"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <p className="font-serif text-2xl font-bold tracking-[0.15em]">
            SkipTheMid
          </p>
        </div>

        {/* Contact */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-white/70">
          <a
            href="mailto:skipthemid@gmail.com"
            className="hover:underline"
          >
            <span>Contact us </span>
            <span className="font-semibold text-white">
              skipthemid@gmail.com
            </span>
          </a>
        </div>

        {/* Divider */}
        <div className="mt-5 h-px bg-teal-400/20" />

        {/* Bottom row: nav | copyright | social */}
        <div className="mt-4 grid grid-cols-1 items-center gap-4 text-center md:grid-cols-3 md:text-left">
          {/* Nav */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/70 md:justify-start">
            <Link href="/about" className="hover:text-white">
              About us
            </Link>
            <Link href="/sitemap" className="hover:text-white">
              Site map
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms &amp; conditions
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-white/70 md:text-center">
            © 2026 SkipTheMid — All Rights Reserved
          </p>

          {/* Social */}
          <div className="flex items-center justify-center gap-3 md:justify-end">
            <span className="text-xs uppercase tracking-widest text-white/70">
              Follow us
            </span>
            <a
              href="https://x.com/skipthemid"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <XIcon />
            </a>
            {/* Reserved space for additional social handles (Instagram, TikTok, etc.) */}
          </div>
        </div>
      </div>
    </footer>
  );
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
