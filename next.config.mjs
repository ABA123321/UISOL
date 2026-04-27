import path from "node:path"
import { fileURLToPath } from "node:url"

// 把 Turbopack root 锁定到当前 Next.js 工程目录，
// 避免上层文件系统中存在的无关 lockfile 影响模块解析。
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
