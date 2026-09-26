import type { Metadata, Viewport } from "next";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/700-italic.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/800-italic.css";
import "@fontsource/montserrat/900.css";
import "@fontsource/montserrat/900-italic.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/600-italic.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/700-italic.css";
import "@fontsource/nunito/800.css";
import "@fontsource/nunito/800-italic.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import { MALTINA_PRIMARY } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Maltina — Participe et tente de gagner",
  description: "Participez et tentez de gagner plusieurs cadeaux Maltina.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: MALTINA_PRIMARY },
    { media: "(prefers-color-scheme: dark)", color: MALTINA_PRIMARY },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
