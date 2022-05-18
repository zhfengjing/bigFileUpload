/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api',
  //       destination: 'http://localhost:7001', // The :path parameter is used here so will not be automatically passed in the query
  //     },
  //   ]
  // },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
