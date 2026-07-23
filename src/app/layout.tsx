import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ritinha Tradutor",
  description: "Tradutor voz e câmera da Ritinha - PT <> EN, ES, IT, FR, DE, JA, ZH",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Ritinha",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFD700",
  backgroundColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
