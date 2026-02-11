import Link from "next/link";

export default function Hero() {
  return (
    <section className="py-16 text-center">
      <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Discover the World&apos;s
        <br />
        Most Extraordinary Dishes
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
        A food encyclopedia for the curious eater. Explore exotic, lesser-known
        authentic dishes from every corner of the globe.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/map"
          className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
        >
          Explore Map
        </Link>
        <a
          href="#dishes"
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Browse Dishes
        </a>
      </div>
    </section>
  );
}
