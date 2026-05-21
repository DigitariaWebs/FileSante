import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Legacy `.html` URL aliases from the original HTML-only mock site.
  // Permanent redirects so old QR codes / printed links keep working.
  async redirects() {
    return [
      { source: "/dashboard.html", destination: "/dashboard/triage", permanent: true },
      { source: "/dashboard-811.html", destination: "/dashboard/811", permanent: true },
      { source: "/dashboard-director.html", destination: "/dashboard/direction", permanent: true },
      { source: "/dashboard-provincial.html", destination: "/dashboard/msss", permanent: true },
      { source: "/patient.html", destination: "/dashboard/patient", permanent: true },
    ];
  },
};

export default nextConfig;
