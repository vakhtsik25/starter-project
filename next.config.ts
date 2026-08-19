import type { NextConfig } from "next";
import { SITE_URL } from "./lib/site";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // This project also resolves on Vercel's auto-generated aliases —
        // this tells crawlers/agents which domain is the canonical one.
        source: "/",
        headers: [
          { key: "Link", value: `<${SITE_URL}/>; rel="canonical"` },
        ],
      },
    ];
  },
};

export default nextConfig;
