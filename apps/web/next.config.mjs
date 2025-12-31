/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@arcle/ui"],
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  }
}

export default nextConfig
