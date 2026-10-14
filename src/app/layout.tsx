import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Resume Tailor — Match your resume to any job description",
    template: "%s · Resume Tailor",
  },
  description:
    "Upload your resume and a job description. Get an honest ATS match score and a tailored, single-page resume rewrite.",
  applicationName: "Resume Tailor",
  keywords: [
    "resume",
    "ATS",
    "resume tailor",
    "job description",
    "career",
    "keyword matching",
  ],
  authors: [{ name: "Resume Tailor" }],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    siteName: "Resume Tailor",
    title: "Resume Tailor — Match your resume to any job description",
    description:
      "Get an honest ATS match score and a tailored, single-page resume rewrite — with zero invented experience.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume Tailor — Match your resume to any job description",
    description:
      "Get an honest ATS match score and a tailored, single-page resume rewrite.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#131110" },
  ],
};

const THEME_SCRIPT = `(function () {
  try {
    var raw = localStorage.getItem("resume-tailor-settings");
    var theme = raw ? JSON.parse(raw).theme : "system";
    var dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
