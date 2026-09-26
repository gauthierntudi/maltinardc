import type { Metadata, Viewport } from "next";
import { Montserrat, Nunito } from "next/font/google";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import { MALTINA_PRIMARY } from "@/lib/brand";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-nunito",
  display: "swap",
});

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
    <html lang="fr" className={`${montserrat.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
