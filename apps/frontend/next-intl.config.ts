// apps/frontend/next-intl.config.ts
import { getRequestConfig } from "next-intl/server";

import enMessages from "./src/messages/en.json";
import frMessages from "./src/messages/fr.json";

const messagesMap = {
  en: enMessages,
  fr: frMessages,
};

export default getRequestConfig(async ({ locale }) => {
  const fallbackLocale = "en";
  const selectedLocale = locale ?? fallbackLocale;
  return {
    locale: selectedLocale,
    messages: messagesMap[selectedLocale as "en" | "fr"] || enMessages,
  };
});
