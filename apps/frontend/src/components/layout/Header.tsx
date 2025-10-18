"use client";

import "../../app/globals.css";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import LanguageSwitcher from "../ui/LanguageSwitcher";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const tFooter = useTranslations("Footer");
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-bold text-2xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            width={28}
            height={28}
            className="text-blue-500 dark:text-blue-300"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6l4 2"
            />
          </svg>
          <span>{tFooter("brandName")}</span>
        </div>

        {/* Desktop Nav */}
        {status === "authenticated" && session?.user ? (
          <nav className="hidden md:flex gap-6 p-4 text-base items-center">
            <Link
              href={`/${locale}/dashboard`}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              {t("dashboard")}
            </Link>
            <Link
              href={`/${locale}/candidates` as any}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              {t("candidates")}
            </Link>
            <Link
              href={`/${locale}/billing`}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              {t("billing") || "Billing"}
            </Link>
            <LanguageSwitcher />
            <span className="ml-4 text-sm text-gray-600 dark:text-gray-300">
              {t("signedInAs")}{" "}
              <span className="font-semibold">{session.user.email}</span>
            </span>
            <button
              className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={() => signOut()}
            >
              {t("signOut")}
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex gap-4 items-center">
            <LanguageSwitcher />
            <Link
              href={`/${locale}/login`}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition px-4 py-2 rounded-lg font-medium"
            >
              {t("signIn")}
            </Link>
            <Link
              href={`/${locale}/signup`}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-center font-semibold shadow hover:bg-blue-500 transition"
            >
              {t("signUp") || "Sign Up"}
            </Link>
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus:outline-none p-2 rounded"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <X width={24} height={24} strokeWidth={2} />
          ) : (
            <Menu width={24} height={24} strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          {status === "authenticated" && session?.user ? (
            <nav className="flex flex-col gap-2 px-6 py-4 text-base">
              <Link
                href={`/${locale}/dashboard`}
                className="py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                {t("dashboard")}
              </Link>
              <Link
                href={`/${locale}/candidates` as any}
                className="py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                {t("candidates")}
              </Link>
              <Link
                href={`/${locale}/billing`}
                className="py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                {t("billing") || "Billing"}
              </Link>
              <div className="py-2">
                <LanguageSwitcher />
              </div>
              <span className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {t("signedInAs")}{" "}
                <span className="font-semibold">{session.user.email}</span>
              </span>
              <button
                className="mt-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
              >
                {t("signOut")}
              </button>
            </nav>
          ) : (
            <div className="flex flex-col gap-3 px-6 py-4">
              <div className="py-2">
                <LanguageSwitcher />
              </div>
              <Link
                href={`/${locale}/login`}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition py-2 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {t("signIn")}
              </Link>
              <Link
                href={`/${locale}/signup`}
                className="bg-blue-600 text-white px-5 py-3 rounded-lg text-center font-semibold shadow hover:bg-blue-500 transition"
                onClick={() => setMenuOpen(false)}
              >
                {t("signUp") || "Sign Up"}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
