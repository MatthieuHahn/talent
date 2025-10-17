"use client";
import { useTranslations, useLocale } from "next-intl";
import Button from "@/components/ui/Button";
import LocaleLayout from "@/components/layout/Layout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function IndexPage() {
  const t = useTranslations("Index");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect logged-in users to dashboard
  if (status === "authenticated" && session?.user) {
    router.replace(`/${locale}/dashboard`);
    return null;
  }

  return (
    <section className="text-center mt-20">
      <h1 className="text-5xl font-bold text-primary mb-6">{t("title")}</h1>
      <p className="text-lg text-secondary mb-10">{t("description")}</p>
      <div className="flex justify-center gap-4">
        <a href={`/${locale}/signup`}>
          <Button>Get Started</Button>
        </a>
        <a href={`/${locale}/login`}>
          <Button variant="outline">Login</Button>
        </a>
      </div>
    </section>
  );
}
