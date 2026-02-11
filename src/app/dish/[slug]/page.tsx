import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import StarRating from "@/components/dish/StarRating";
import RatingInput from "@/components/dish/RatingInput";

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

export default async function DishPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dish = await prisma.dish.findUnique({
    where: { slug },
    include: { ratings: { select: { value: true, userId: true } } },
  });

  if (!dish) notFound();

  const avg =
    dish.ratings.length > 0
      ? dish.ratings.reduce((sum, r) => sum + r.value, 0) / dish.ratings.length
      : null;

  // Get current user's existing rating (if logged in)
  const session = await auth();
  const userRating = session?.user?.id
    ? dish.ratings.find((r) => r.userId === session.user!.id)?.value
    : undefined;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{dish.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
            {dish.cuisine}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {dish.category}
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            {dish.origin}
          </span>
        </div>
        <div className="mt-3">
          <StarRating
            average={avg ? Math.round(avg * 10) / 10 : null}
            count={dish.ratings.length}
          />
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">About</h2>
        <p className="whitespace-pre-line leading-relaxed text-gray-700">
          {dish.description}
        </p>
      </section>

      {dish.recipe && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">Recipe</h2>
          <p className="whitespace-pre-line leading-relaxed text-gray-700">
            {dish.recipe}
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          Rate this dish
        </h2>
        <RatingInput dishId={dish.id} initialRating={userRating} />
      </section>
    </main>
  );
}
