import type { Metadata, Viewport } from "next";
import { Inter, Lora, Sora } from "next/font/google";
import Script from "next/script";
import Providers from "@/components/Providers";
import Toast from "@/components/Toast";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import GoogleOneTap from "@/components/GoogleOneTap";
import "../index.css";
import "../styles/landing.css";
import "../styles/ourstory.css";
import "../styles/dashboard.css";
import "../styles/admin.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

// Serif display face for dashboard headings and large stat figures (design
// reference: UI/1 INVESTOR DASHBOARD.jpg — "Investor Dashboard" title +
// stat numbers). Body text, nav and buttons stay on Inter/Sora.
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

// Apply the persisted theme before hydration to avoid a flash of the wrong theme.
const THEME_INIT = `(function(){try{var t=localStorage.getItem("fre_theme");if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

// PWA: manifest link + install-related head tags. themeColor lives in the
// separate `viewport` export (Next.js App Router convention — it moved out of
// `metadata` in recent Next versions). Colors match --navy-ink (#0f1b33).
export const metadata: Metadata = {
  title: "Flux — Premium Real-Estate Investment",
  description:
    "Access institutional-grade real estate assets through fractional ownership. Secure, transparent, and built for the next generation of global investors.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Flux",
  },
  icons: {
    icon: [
      { url: "/logo/logo.webp" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1b33",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${lora.variable}`} suppressHydrationWarning>
      <head>
        {/* Runs before hydration so the saved theme attribute is already on
            <html> before first paint — avoids a flash of the wrong theme. */}
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla) inject
          attributes like cz-shortcut-listen="true" onto <body> before React
          hydrates. Our code never writes to document.body's attributes, so this
          is the standard fix for extension-injected attributes. */}
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <Toast />
          <ServiceWorkerRegister />
          <GoogleOneTap />
          <PwaInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
