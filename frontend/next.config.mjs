/** @type {import('next').NextConfig} */
import path from 'path'

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  // transpilePackages: ['undici', '@firebase/auth'],
  webpack: (config, { webpack, isServer }) => {
    // Alias RN AsyncStorage to a web-friendly stub to satisfy MetaMask SDK in Next.js
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': path.resolve(
        process.cwd(),
        'src/polyfills/asyncStorageStub.ts'
      ),
    }

    // Use IgnorePlugin to ignore test files and other non-essential files from thread-stream
    config.plugins = config.plugins || []
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/test/,
        contextRegExp: /thread-stream/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/bench/,
        contextRegExp: /thread-stream/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /LICENSE$/,
        contextRegExp: /thread-stream/,
      })
    )

    // Ignore warnings for problematic modules
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/thread-stream/,
      },
    ]

    return config
  },
  output: 'standalone',
}

export default nextConfig