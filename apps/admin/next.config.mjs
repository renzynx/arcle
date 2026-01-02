/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: [
    "@arcle/ui",
    "@arcle/query",
    "@arcle/auth-client",
    "@arcle/api-client",
  ],
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
};

export default nextConfig;
