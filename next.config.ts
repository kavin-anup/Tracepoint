import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.tracepoint.vercel.app",
          },
        ],
        destination: "https://tracepoint.vercel.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
