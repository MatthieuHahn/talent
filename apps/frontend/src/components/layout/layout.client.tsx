"use client";
import { NextIntlClientProvider } from "next-intl";
import LocaleSessionProvider from "../../app/[locale]/SessionProvider";
import Header from "./Header";
import type { ReactNode } from "react";

export default function LocaleLayoutClient({
  children,
  messages,
  locale,
}: {
  children: ReactNode;
  messages: any;
  locale: string;
}) {
  return (
    <LocaleSessionProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <Header />
        {children}
      </NextIntlClientProvider>
    </LocaleSessionProvider>
  );
}
