import "@/styles/globals.css";
import "katex/dist/katex.min.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/core/i18n/context";
import { detectLocaleServer } from "@/core/i18n/server";

const metadataByLocale: Record<"en-US" | "zh-CN", Metadata> = {
  "en-US": {
    title: "DeerFlow",
    description: "A LangChain-based framework for building super agents.",
  },
  "zh-CN": {
    title: "DeerFlow",
    description: "一个基于 LangChain 的超级智能体构建框架。",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocaleServer();
  return metadataByLocale[locale] ?? metadataByLocale["en-US"];
}

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await detectLocaleServer();
  return (
    <html
      lang={locale}
      className={geist.variable}
      suppressContentEditableWarning
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
          <I18nProvider initialLocale={locale}>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
