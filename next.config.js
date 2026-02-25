/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "@prisma/client", "@auth/core", "next-auth"],
  },
};

module.exports = nextConfig;
