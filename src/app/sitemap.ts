import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://skipthemid.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dishes = await prisma.dish.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { name: "asc" },
  });

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/map`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/dishes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  const dishPages: MetadataRoute.Sitemap = dishes.map((d) => ({
    url: `${BASE_URL}/dish/${d.slug}`,
    lastModified: d.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...dishPages];
}
