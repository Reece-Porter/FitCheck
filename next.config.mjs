/** @type {import('next').NextConfig} */

// When deploying to a GitHub Pages *project* site the app is served from a
// sub-path (e.g. /Pool-table-rules). Set NEXT_PUBLIC_BASE_PATH at build time
// to that path; leave it empty for local dev or a root/custom-domain deploy.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  // The app renders arbitrary remote product photos with plain <img>; skip the
  // eslint <img> warning so it doesn't clutter the build.
  eslint: { ignoreDuringBuilds: true }
};

export default nextConfig;
