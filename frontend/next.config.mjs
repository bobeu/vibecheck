/** @type {import('next').NextConfig} */
import path from 'path'

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  // transpilePackages: ['undici', '@firebase/auth'],
  // Empty turbopack config to silence the error - webpack config will be used when needed
  turbopack: {},
  webpack: (config) => {
    // Alias RN AsyncStorage to a web-friendly stub to satisfy MetaMask SDK in Next.js
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': path.resolve(
        process.cwd(),
        'src/polyfills/asyncStorageStub.ts'
      ),
    }
    return config
  },
  output: 'standalone',
}

export default nextConfig