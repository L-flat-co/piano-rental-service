/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['resend', '@react-pdf/renderer'],
  },
}

export default nextConfig
