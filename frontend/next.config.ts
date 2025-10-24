import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración de experimental para React 19 y Next.js 15
  experimental: {
    // Deshabilitar el cache HMR que está causando problemas con chunks
    serverComponentsHmrCache: false,
    // React Compiler está en desarrollo - mejor mantenerlo deshabilitado
    reactCompiler: false,
  },

  // Configuración específica para el modo de desarrollo
  ...(process.env.NODE_ENV === 'development' && {
    // En Next.js 15, SWC es el minificador por defecto
    // No hay configuraciones específicas necesarias para desarrollo
  }),

  // Configuración de webpack para resolver problemas de chunks
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Configuración más conservadora para desarrollo
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
          },
        },
      }

      // Configuración para mejorar HMR
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }

    // Deshabilitar el cache de webpack en desarrollo para evitar problemas
    if (dev && config.cache) {
      config.cache = Object.freeze({
        type: 'memory',
      })
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

  // Headers de seguridad simplificados para desarrollo
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:3000; frame-ancestors 'none';"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:3000 ws://localhost:3001 wss://localhost:3001; frame-ancestors 'none';",
          },
        ],
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
