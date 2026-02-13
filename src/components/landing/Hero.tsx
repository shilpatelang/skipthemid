import Link from "next/link";

interface HeroProps {
  backgroundImage: string;
}

export default function Hero({ backgroundImage }: HeroProps) {
  return (
    <section
      className="relative flex min-h-[85vh] items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-charcoal" />

      {/* Content */}
      <div className="relative z-10 px-4 text-center">
        <h1 className="mt-6 font-serif text-5xl font-bold leading-tight tracking-[0.15em] text-white sm:text-6xl lg:text-7xl">
          SkipTheMid
        </h1>
        <p className="mt-2 font-serif text-2xl font-light tracking-wide text-white/80 sm:text-3xl">
          Discover the World&apos;s Most Extraordinary Dishes
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/map"
            className="cta-glow rounded-lg bg-gold px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-charcoal"
          >
            Explore Map
          </Link>
          <a
            href="#dishes"
            className="cta-glow rounded-lg bg-gold px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-charcoal"
          >
            Browse Dishes
          </a>
        </div>
      </div>
    </section>
  );
}
