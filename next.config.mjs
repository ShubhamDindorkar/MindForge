/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { dev, isServer }) {
    // Work around CssMinimizerPlugin parsing bug ("Unclosed string" in CSS)
    if (!dev && !isServer && config.optimization) {
      config.optimization.minimize = false;
    }
    return config;
  },
};

export default nextConfig;
