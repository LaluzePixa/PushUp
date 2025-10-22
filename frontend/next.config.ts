import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración de experimental para React 19
  experimental: {
    // Configuraciones para React 19
    reactCompiler: false,
  },

  // Configuración adicional para chunks
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Configuración específica para desarrollo
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }
    return config
  },

  // Deshabilitar indicadores de desarrollo problemáticos
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },

  // Configuración de rewrites para el proxy del backend en desarrollo
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/:path*',
      },
    ];
  },

  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  },
};

export default nextConfig;
