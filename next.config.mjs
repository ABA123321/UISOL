import path from "node:path"
import { fileURLToPath } from "node:url"

// Pin Turbopack root to the repo root (parent of UISOL), not the user home folder.
// - Avoids wrong root when a stray lockfile exists higher up (e.g. under the user profile).
// - Keeps `UISOL/lib/web3/abi.ts` imports to `../../../artifacts/...` inside the root
//   (Turbopack does not resolve modules outside `turbopack.root`).
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, "..")

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: repoRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
