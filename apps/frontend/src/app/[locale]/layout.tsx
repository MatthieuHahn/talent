import LocaleLayoutClient from "@/components/layout/layout.client";
import type { ReactNode } from "react";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: any;
}) {
  const awaitedParams =
    typeof params.then === "function" ? await params : params;
  const { locale } = awaitedParams;

  // Load messages for the current locale using require (server context)
  let messages = {};
  try {
    messages = require(`@/messages/${locale}.json`);
  } catch (err) {
    messages = require("@/messages/en.json");
  }
  console.log("Loaded messages for locale:", locale, messages);
  return (
    <LocaleLayoutClient messages={messages} locale={locale}>
      {children}
    </LocaleLayoutClient>
  );
}
