import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const SITE_URL = "https://payee.eglavin.com";
const SITE_NAME = "Payee";
const TITLE = "Payee — bank transaction dashboard";
const DESCRIPTION =
  "Upload AIB and Revolut bank transaction exports (CSV) to see spending broken down by payee, with charts, filters, and fuzzy payee matching — parsed entirely in your browser, never uploaded.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "bank transactions",
    "AIB",
    "Revolut",
    "CSV export",
    "spending by payee",
    "personal finance dashboard",
    "budgeting",
  ],
  authors: [{ name: "Eanna Glavin", url: "https://eglavin.com" }],
  creator: "Eanna Glavin",
  category: "finance",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_IE",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Runs before hydration to apply the stored/system theme immediately, so
// there's no flash of the wrong theme on load. Reads the same "theme" key
// (and JSON-string encoding) that useLocalStorage writes.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var r=t?JSON.parse(t):'system';var d=r==='dark'||(r==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
