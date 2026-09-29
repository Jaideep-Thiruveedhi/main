/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode double-invokes effects in dev, which makes @react-three/fiber
  // v9 synchronously unmount its reconciler root mid-render ("Attempted to
  // synchronously unmount a root while React was already rendering").
  // Disabled so the console stays clean; see WORLD_README.md.
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:4000/api/:path*',
      },
    ];
  },
};
export default nextConfig;
