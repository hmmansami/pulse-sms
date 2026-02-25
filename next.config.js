/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client", "@auth/core", "next-auth"],
};

module.exports = nextConfig;
