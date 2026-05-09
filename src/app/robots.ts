import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://shiftready.com.au";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/marketplace", "/marketplace/"],
        disallow: ["/dashboard", "/create", "/inventory/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
