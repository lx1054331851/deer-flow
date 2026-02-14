"use client";

import MagicBento, { type BentoCardProps } from "@/components/ui/magic-bento";
import { useI18n } from "@/core/i18n/hooks";
import { cn } from "@/lib/utils";

import { Section } from "../section";

const COLOR = "#0a0a0a";

export function WhatsNewSection({ className }: { className?: string }) {
  const { t } = useI18n();
  const features: BentoCardProps[] = t.landing.sections.whatsNew.features.map(
    (item) => ({
      color: COLOR,
      label: item.label,
      title: item.title,
      description: item.description,
    }),
  );

  return (
    <Section
      className={cn("", className)}
      title={t.landing.sections.whatsNew.title}
      subtitle={t.landing.sections.whatsNew.subtitle}
    >
      <div className="flex w-full items-center justify-center">
        <MagicBento data={features} />
      </div>
    </Section>
  );
}
