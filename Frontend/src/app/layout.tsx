import type { Metadata } from "next";
import { Inter, Lora, Sora } from "next/font/google";
import Script from "next/script";
import Providers from "@/components/Providers";
import Toast from "@/components/Toast";
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

export const metadata: Metadata = {
  title: "Flux — Premium Real-Estate Investment",
  description:
    "Access institutional-grade real estate assets through fractional ownership. Secure, transparent, and built for the next generation of global investors.",
  icons: { icon: "/logo/logo.webp" },
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
        </Providers>
      </body>
    </html>
  );
}
