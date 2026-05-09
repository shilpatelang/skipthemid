import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.skipthemid.com" }],
        destination: "https://skipthemid.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
