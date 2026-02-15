"use client";

import { Streamdown } from "streamdown";
import { useI18n } from "@/core/i18n/hooks";

import { aboutMarkdownEnUS, aboutMarkdownZhCN } from "./about-content";

export function AboutSettingsPage() {
  const { locale } = useI18n();
  const aboutMarkdown = locale === "zh-CN" ? aboutMarkdownZhCN : aboutMarkdownEnUS;

  return <Streamdown>{aboutMarkdown}</Streamdown>;
}
