import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import StarRating from "@/components/dish/StarRating";
import RatingInput from "@/components/dish/RatingInput";
import DishTabs from "@/components/dish/DishTabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dish = await prisma.dish.findUnique({ where: { slug } });
  if (!dish) return { title: "Dish Not Found" };
  return {
    title: `${dish.name} — SkipTheMid`,
    description: dish.description.slice(0, 160),
  };
}

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export default async function DishPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dish = await prisma.dish.findUnique({
    where: { slug },
    include: {
      ratings: { select: { value: true, userId: true } },
      places: true,
    },
  });

  if (!dish) notFound();

  const avg =
    dish.ratings.length > 0
      ? dish.ratings.reduce((sum, r) => sum + r.value, 0) / dish.ratings.length
      : null;

  const session = await auth();
  const userRating = session?.user?.id
    ? dish.ratings.find((r) => r.userId === session.user!.id)?.value
    : undefined;

  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapImageUrl = mapToken
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+d4af37(${dish.longitude},${dish.latitude})/${dish.longitude},${dish.latitude},4,0/600x300@2x?access_token=${mapToken}`
    : "";

  const ingredients = dish.ingredients as Ingredient[] | null;
  const steps = dish.steps as string[] | null;

  return (
    <main className="min-h-screen bg-charcoal px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-lg text-white/60 transition-colors hover:text-white/90"
        >
          <span>←</span> Back to dishes
        </Link>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          {dish.imageUrl && (
            <div className="relative aspect-[2/1] w-full">
              <Image
                src={dish.imageUrl}
                alt={dish.name}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium uppercase tracking-wide text-white/40">
            <span>{dish.cuisine}</span>
            <span className="text-white/20">·</span>
            <span>{dish.category}</span>
          </div>

          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {dish.name}
          </h1>

          <p className="mt-3 text-base text-white/50">{dish.origin}</p>

          <div className="mt-4 flex items-center gap-4">
            <StarRating
              average={avg ? Math.round(avg * 10) / 10 : null}
              count={dish.ratings.length}
            />
            <div className="h-5 w-px bg-white/10" />
            <RatingInput dishId={dish.id} initialRating={userRating} size="sm" />
          </div>

          <section className="mt-10">
            <p className="text-lg leading-relaxed text-white/70">{dish.description}</p>
          </section>

          <section className="mt-10">
            <DishTabs
              ingredients={ingredients}
              steps={steps}
              prepTime={dish.prepTime}
              cookTime={dish.cookTime}
              servings={dish.servings}
              places={dish.places}
              origin={dish.origin}
              mapImageUrl={mapImageUrl}
            />
          </section>

          <section className="mt-12 border-t border-white/10 pt-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
              Rate this dish
            </h2>
            <div className="mt-3">
              <RatingInput dishId={dish.id} initialRating={userRating} />
            </div>
          </section>
          </div>
        </div>
      </div>
    </main>
  );
}
