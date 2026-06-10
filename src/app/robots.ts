import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://myrio.com.au";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/market", "/market/sale/"],
        disallow: [
          "/seller-central/",
          "/api/",
          "/login",
          "/register",
          "/dashboard",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
