import type { MetadataRoute } from "next";

const BASE_URL = "https://skipthemid.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Filter/search/page query strings duplicate the canonical /dishes
        // content. Disallow crawl to consolidate ranking signal.
        disallow: ["/api/", "/dishes?*"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
