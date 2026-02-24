/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client"],
};

module.exports = nextConfig;
