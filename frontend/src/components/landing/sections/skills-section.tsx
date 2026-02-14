"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/core/i18n/hooks";

import ProgressiveSkillsAnimation from "../progressive-skills-animation";
import { Section } from "../section";

export function SkillsSection({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <Section
      className={cn("h-[calc(100vh-64px)] w-full bg-white/2", className)}
      title={t.landing.sections.skills.title}
      subtitle={
        <div>
          {t.landing.sections.skills.subtitleLine1}
          <br />
          {t.landing.sections.skills.subtitleLine2}
        </div>
      }
    >
      <div className="relative overflow-hidden">
        <ProgressiveSkillsAnimation />
      </div>
    </Section>
  );
}
