/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@baddabing/framework'],
  experimental: {
    // Next.js-native opt-out for bundling these in the server-component
    // layer. The webpack() hook below is the secondary defence for the
    // instrumentation bundle, which webpack resolves independently.
    serverComponentsExternalPackages: [
      'fs', 'path',
      '@anthropic-ai/sdk',
      '@anthropic-ai/claude-agent-sdk',
      'better-sqlite3',
      'nats',
    ],
    instrumentationHook: true,
  },
  // Server-runtime bundles (both nodejs and edge) must leave Node
  // built-ins and native packages as bare require() calls. Without
  // this, webpack tries to polyfill them for the Edge runtime and
  // fails — even though our register() exits early on non-Node
  // runtimes, webpack still statically analyses every dynamic import.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      const nodeBuiltins = [
        'fs', 'path', 'crypto', 'os', 'util', 'stream', 'stream/web',
        'events', 'child_process', 'net', 'tls', 'url', 'buffer',
        'node:fs', 'node:fs/promises', 'node:path', 'node:crypto',
        'node:os', 'node:util', 'node:stream', 'node:stream/web',
        'node:events', 'node:child_process', 'node:net', 'node:tls',
        'node:url', 'node:buffer', 'node:console', 'node:process',
      ]
      const sdkPackages = [
        '@anthropic-ai/sdk',
        '@anthropic-ai/claude-agent-sdk',
        'better-sqlite3',
        'nats',
      ]
      const externalSet = new Set([...nodeBuiltins, ...sdkPackages])
      config.externals.push(function externalize({ request }, cb) {
        if (externalSet.has(request)) {
          return cb(null, 'commonjs ' + request)
        }
        cb()
      })
    }
    return config
  },
}

export default nextConfig
