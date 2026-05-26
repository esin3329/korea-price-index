import type { MetadataRoute } from "next";
import { countryPages, siteUrl } from "@/app/countries/country-content";

export const dynamic = "force-static";

const staticRoutes = [
  "",
  "/dashboard",
  "/countries",
  "/about",
  "/methodology",
  "/privacy",
  "/contact",
  "/disclaimer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" || route === "/dashboard" ? 1 : 0.7,
    })),
    ...countryPages.map((country) => ({
      url: `${siteUrl}/countries/${country.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
