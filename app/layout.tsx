import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Venture Atlas — cartographie startups, tendances et idées",
  description: "Un atlas de recherche interactif pour comparer l’écosystème des startups IA, les tendances de marché et les thèses business à explorer.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "AI Venture Atlas",
    description: "254 entreprises, 15 tendances et 30 thèses pour comprendre où la valeur et les moats se forment dans l’IA.",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Cartographie abstraite de l’écosystème mondial des startups IA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Venture Atlas",
    description: "Cartographie sourcée des startups IA, tendances, capital et idées à falsifier.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
