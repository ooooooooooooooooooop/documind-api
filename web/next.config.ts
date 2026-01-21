import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",  // 优化 Docker 构建体积
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // 在 Docker Compose 网络中，后端服务名叫 "api"
        // 本地开发时走 localhost，Docker 运行时走 http://api:8000
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://api:8000/:path*' 
          : 'http://127.0.0.1:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
