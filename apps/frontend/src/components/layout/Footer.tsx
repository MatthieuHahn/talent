"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-[var(--color-card)] border-t border-[var(--color-border)] py-8 mt-20">
      <div className="max-w-7xl mx-auto px-6 text-center text-[var(--color-secondary)]">
        <p className="text-sm">
          {t("copyright", {
            year: new Date().getFullYear(),
            brandName: t("brandName"),
          })}
        </p>
        <div className="mt-2 flex justify-center gap-4 text-[var(--color-primary)]">
          <Link
            href="/privacy"
            className="hover:text-[var(--color-accent)] transition"
          >
            {t("privacyPolicy")}
          </Link>
          <Link
            href="/terms"
            className="hover:text-[var(--color-accent)] transition"
          >
            {t("termsOfService")}
          </Link>
          <Link
            href="/contact"
            className="hover:text-[var(--color-accent)] transition"
          >
            {t("contact")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
