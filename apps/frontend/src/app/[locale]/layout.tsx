import LocaleLayoutClient from "@/components/layout/layout.client";
import type { ReactNode } from "react";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const awaitedParams = await params;
  const { locale } = awaitedParams;

  // Load messages for the current locale using dynamic import (server context)
  let messages = {};
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (err) {
    messages = (await import("@/messages/en.json")).default;
  }

  return (
    <LocaleLayoutClient messages={messages} locale={locale}>
      {children}
    </LocaleLayoutClient>
  );
}
