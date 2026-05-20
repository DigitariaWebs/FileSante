import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FileSanté — Le bon patient, au bon endroit, en temps réel",
  description:
    "Plateforme de routage des patients P4/P5 vers les ressources de première ligne — projet pilote Montréal 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
