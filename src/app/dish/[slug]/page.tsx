import { notFound } from "next/navigation";
import Link from "next/link";
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
    ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+f59e0b(${dish.longitude},${dish.latitude})/${dish.longitude},${dish.latitude},4,0/600x300@2x?access_token=${mapToken}`
    : "";

  const ingredients = dish.ingredients as Ingredient[] | null;
  const steps = dish.steps as string[] | null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-base text-gray-500 transition-colors hover:text-gray-800"
      >
        <span>←</span> Back to dishes
      </Link>

      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium uppercase tracking-wide text-gray-400">
          <span>{dish.cuisine}</span>
          <span className="text-gray-300">·</span>
          <span>{dish.category}</span>
        </div>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          {dish.name}
        </h1>

        <p className="mt-3 text-base text-gray-500">{dish.origin}</p>

        <div className="mt-4">
          <StarRating
            average={avg ? Math.round(avg * 10) / 10 : null}
            count={dish.ratings.length}
          />
        </div>
      </div>

      <section className="mt-10">
        <p className="text-lg leading-relaxed text-gray-600">{dish.description}</p>
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

      <section className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-400">
          Rate this dish
        </h2>
        <div className="mt-3">
          <RatingInput dishId={dish.id} initialRating={userRating} />
        </div>
      </section>
    </main>
  );
}
