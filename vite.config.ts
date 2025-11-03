import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'development';

    // Set NODE_ENV for the build process
    process.env.NODE_ENV = mode;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        historyApiFallback: true,
        proxy: {
          '/api': {
            target: isProduction ? 'https://tooler-io.onrender.com' : 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [
        react(),
        ...(isProduction ? [visualizer({ filename: 'dist/stats.html', open: false, gzipSize: true, brotliSize: true })] : [])
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID': JSON.stringify(env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Enable source maps for debugging in production
        sourcemap: !isProduction,
        // Optimize chunk splitting for better caching
        rollupOptions: {
          output: {
            // Separate vendor chunks for better caching
            manualChunks: {
              // React and core libraries
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              // UI libraries
              'ui-vendor': ['lucide-react', 'recharts'],
              // External services
              'external-vendor': ['@supabase/supabase-js', '@google/genai', '@paypal/react-paypal-js'],
            },
            // Optimize chunk file names for caching
            chunkFileNames: (chunkInfo) => {
              const facadeModuleId = chunkInfo.facadeModuleId
                ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
                : 'chunk';
              return `js/${facadeModuleId}-[hash].js`;
            },
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name?.split('.') || [];
              const extType = info[info.length - 1];
              if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
                return `images/[name]-[hash][extname]`;
              }
              if (/\.(css)$/i.test(assetInfo.name || '')) {
                return `css/[name]-[hash][extname]`;
              }
              return `assets/[name]-[hash][extname]`;
            },
          },
        },
        // Optimize bundle size
        minify: isProduction ? 'terser' : false,
        terserOptions: isProduction ? {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'],
            passes: 2, // Multiple passes for better compression
            unsafe: true, // Enable unsafe optimizations
            unsafe_comps: true, // Compress comparisons
            unsafe_Function: true, // Compress function calls
            unsafe_math: true, // Optimize mathematical operations
            unsafe_symbols: true, // Compress property access
            unsafe_methods: true, // Compress method calls
            unsafe_proto: true, // Compress prototype access
            unsafe_regexp: true, // Compress regular expressions
            unsafe_undefined: true, // Compress undefined checks
          },
          mangle: {
            safari10: true,
            properties: {
              regex: /^_[A-Za-z]/, // Mangle private properties
            },
          },
        } : undefined,
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Enable CSS code splitting
        cssCodeSplit: true,
        // Target modern browsers for smaller bundles
        target: 'esnext',
        // Pre-bundle dependencies for better performance
        commonjsOptions: {
          include: [/node_modules/],
        },
        // Enable gzip compression
        reportCompressedSize: false,
      },
      // Optimize dependencies
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          '@supabase/supabase-js',
          'recharts',
          'lucide-react'
        ],
        exclude: ['@vite/client', '@vite/env'],
      },
      // Enable compression in preview mode
      preview: {
        port: 4173,
        strictPort: true,
      },
    };
});
