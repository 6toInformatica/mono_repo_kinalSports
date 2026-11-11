import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagen de producción mínima (node server.js) para Docker
  output: "standalone",
  poweredByHeader: false,
  images: {
    // Logos, fotos de canchas y avatares vienen de Cloudinary
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
