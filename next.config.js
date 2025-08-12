/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  images: { formats: ['image/webp'] },

  webpack: (config, { dev, isServer, webpack }) => {
    // Only in dev, only for client, and avoid node_modules
    if (dev && !isServer) {
      config.module.rules.push({
        test: /\.mjs$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: ['source-map-loader'],
      });
    }
    return config;
  },

  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
      ],
    },
  ],
};

module.exports = nextConfig;
