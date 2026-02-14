import { enUS, zhCN } from "@/core/i18n";
import { detectLocaleServer } from "@/core/i18n/server";

export async function Footer() {
  const locale = await detectLocaleServer();
  const t = locale === "zh-CN" ? zhCN : enUS;
  const year = new Date().getFullYear();

  return (
    <footer className="container-md mx-auto mt-32 flex flex-col items-center justify-center">
      <hr className="from-border/0 to-border/0 m-0 h-px w-full border-none bg-linear-to-r via-white/20" />
      <div className="text-muted-foreground container flex h-20 flex-col items-center justify-center text-sm">
        <p className="text-center font-serif text-lg md:text-xl">
          {t.landing.footer.quote}
        </p>
      </div>
      <div className="text-muted-foreground container mb-8 flex flex-col items-center justify-center text-xs">
        <p>{t.landing.footer.license}</p>
        <p>&copy; {year} DeerFlow</p>
      </div>
    </footer>
  );
}
