/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@arcle/ui",
    "@arcle/query",
    "@arcle/auth-client",
    "@arcle/api-client",
  ],
  typedRoutes: true,
  output: "standalone",
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  reactStrictMode: false,
};

export default nextConfig;
