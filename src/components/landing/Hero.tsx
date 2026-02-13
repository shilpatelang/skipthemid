import Link from "next/link";

export default function Hero() {
  return (
    <section className="py-20 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-amber-600">
        A Food Encyclopedia
      </p>
      <h2 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Discover the World&apos;s
        <br />
        Most Extraordinary Dishes
      </h2>
      <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-gray-400">
        Explore exotic, lesser-known authentic dishes from every corner of the
        globe.
      </p>
      <div className="mt-10 flex justify-center gap-3">
        <Link
          href="/map"
          className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800"
        >
          Explore Map
        </Link>
        <a
          href="#dishes"
          className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
        >
          Browse Dishes
        </a>
      </div>
    </section>
  );
}
