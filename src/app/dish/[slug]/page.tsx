import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import StarRating from "@/components/dish/StarRating";
import RatingInput from "@/components/dish/RatingInput";
import DishTabs from "@/components/dish/DishTabs";
import ImageCredit from "@/components/dish/ImageCredit";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dish = await prisma.dish.findUnique({ where: { slug } });
  if (!dish) return { title: "Dish Not Found" };
  const description = dish.description.slice(0, 160);
  // Locked title format: "{name} — {origin} | SkipTheMid"
  // Layout template appends "| SkipTheMid" automatically.
  const title = `${dish.name} — ${dish.origin}`;
  const fullTitle = `${title} | SkipTheMid`;
  return {
    title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: "article",
      ...(dish.imageUrl && {
        images: [{ url: dish.imageUrl, alt: dish.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(dish.imageUrl && {
        images: [dish.imageUrl],
      }),
    },
  };
}

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

const BASE_URL = "https://skipthemid.com";

// Convert minutes to ISO 8601 duration: 30 -> "PT30M", 90 -> "PT1H30M"
function minutesToIso(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `PT${h}H${m}M`;
  if (h) return `PT${h}H`;
  return `PT${m}M`;
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

  // Schema.org Recipe JSON-LD — unlocks Google rich results
  // (image, time, rating shown directly in search). Spread-conditional
  // pattern omits empty fields rather than emitting null/undefined values.
  const totalMinutes = (dish.prepTime ?? 0) + (dish.cookTime ?? 0);
  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: dish.name,
    description: dish.description,
    ...(dish.imageUrl && { image: `${BASE_URL}${dish.imageUrl}` }),
    author: {
      "@type": "Organization",
      name: "SkipTheMid",
      url: BASE_URL,
    },
    recipeCuisine: dish.cuisine,
    recipeCategory: dish.category,
    ...(dish.prepTime && { prepTime: minutesToIso(dish.prepTime) }),
    ...(dish.cookTime && { cookTime: minutesToIso(dish.cookTime) }),
    ...(totalMinutes > 0 && { totalTime: minutesToIso(totalMinutes) }),
    ...(dish.servings && { recipeYield: `${dish.servings} servings` }),
    ...(ingredients?.length && {
      recipeIngredient: ingredients.map((i) =>
        [i.amount, i.unit, i.name].filter(Boolean).join(" ").trim()
      ),
    }),
    ...(steps?.length && {
      recipeInstructions: steps.map((text) => ({
        "@type": "HowToStep",
        text,
      })),
    }),
    ...(avg !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Math.round(avg * 10) / 10,
        reviewCount: dish.ratings.length,
        bestRating: 5,
        worstRating: 0.5,
      },
    }),
  };
  // Escape </script> guard against any raw "<" in user content
  const recipeJsonLdString = JSON.stringify(recipeJsonLd).replace(/</g, "\\u003c");

  return (
    <main className="min-h-screen bg-charcoal px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: recipeJsonLdString }}
      />
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-base font-medium text-white/70 transition-colors hover:text-gold"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-1"
            strokeWidth={2.5}
          />
          Back to dishes
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
              {dish.imageCredit && <ImageCredit credit={dish.imageCredit} licenseUrl={dish.imageLicenseUrl} />}
            </div>
          )}

          <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <span className="text-gold">{dish.cuisine}</span>
            <span className="text-white/30">·</span>
            <span className="text-white/80">{dish.category}</span>
          </div>

          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {dish.name}
          </h1>

          <p className="mt-3 text-base text-white/80">{dish.origin}</p>

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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gold">
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
