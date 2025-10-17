import { useMessages, useLocale } from "next-intl";
import type { ReactNode } from "react";
import LocaleLayoutClient from "./layout.client";

export default function LocaleLayout({ children }: { children: ReactNode }) {
  const messages = useMessages();
  const locale = useLocale();
  return (
    <LocaleLayoutClient messages={messages} locale={locale}>
      {children}
    </LocaleLayoutClient>
  );
}
