import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // upload do avatar (até 2 MB) passa por Server Action; o padrão é 1 MB
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
