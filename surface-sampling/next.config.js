/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|frag|vert)$/,
      use: ["raw-loader", "glslify-loader"],
      exclude: /node_modules/,
    });
    return config;
  },
};

module.exports = nextConfig;
