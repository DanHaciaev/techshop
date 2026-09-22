import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getSettings } from "@/lib/data";
import { buildAccentVars } from "@/lib/color";
import { LocaleProvider } from "@/i18n/locale-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `${settings.shopName} — интернет-магазин техники`,
    description: `${settings.shopName}: смартфоны, ноутбуки, телевизоры и другая техника с доставкой по всей стране.`,
  };
}

// Runs before paint so the CSS-based RU/RO toggle (see globals.css) reflects
// the visitor's saved language immediately, with no server-side cookie read
// (which would force this fully static page to render dynamically).
const LOCALE_INIT_SCRIPT = `
(function () {
  try {
    var m = document.cookie.match(/(?:^|; )locale=([^;]*)/);
    if (m && m[1] === "ro") {
      document.documentElement.setAttribute("data-locale", "ro");
      document.documentElement.lang = "ro";
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const accent = buildAccentVars(settings.accentColor);

  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_INIT_SCRIPT }} />
        <style>{`
          :root {
            --primary: ${accent.light.primary};
            --primary-hover: ${accent.light.primaryHover};
            --primary-soft: ${accent.light.primarySoft};
          }
          .dark {
            --primary: ${accent.dark.primary};
            --primary-hover: ${accent.dark.primaryHover};
            --primary-soft: ${accent.dark.primarySoft};
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <LocaleProvider>{children}</LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
