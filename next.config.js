/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "@prisma/client", "@auth/core", "next-auth"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "@auth/core": "commonjs @auth/core",
      });
    }
    return config;
  },
};

module.exports = nextConfig;
