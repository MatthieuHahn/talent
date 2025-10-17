"use client";

import "../../app/globals.css";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-card)] border-b border-[var(--color-border)] shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 text-[var(--color-primary)] font-bold text-2xl hover:opacity-80 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            width={28}
            height={28}
            className="text-[var(--color-accent)]"
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
          <span>AI Recruiting CRM</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 p-4 text-base items-center">
          <Link
            href={`/${locale}`}
            className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition"
          >
            {t("index")}
          </Link>
          <Link
            href={`/${locale}/candidates` as any}
            className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition"
          >
            {t("candidates")}
          </Link>
          <Link
            href={`/${locale}/dashboard`}
            className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition"
          >
            {t("dashboard")}
          </Link>
          {status === "authenticated" && session?.user ? (
            <>
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
            </>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="bg-[var(--color-primary)] text-white px-5 py-2 rounded-lg text-center font-semibold shadow hover:bg-[var(--color-accent)] transition"
            >
              {t("signIn")}
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-[var(--color-primary)] hover:text-[var(--color-accent)] focus:outline-none p-2 rounded"
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
        <div className="md:hidden bg-[var(--color-card)] border-t border-[var(--color-border)] shadow-lg">
          <nav className="flex flex-col gap-2 px-6 py-4 text-base">
            <Link
              href={`/${locale}`}
              className="py-2 text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition"
            >
              {t("index")}
            </Link>
            <Link
              href={`/${locale}/candidates` as any}
              className="py-2 text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition"
            >
              {t("candidates")}
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              className="py-2 text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition"
            >
              {t("dashboard")}
            </Link>
            {status === "authenticated" && session?.user ? (
              <>
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
              </>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="mt-2 bg-[var(--color-primary)] text-white px-5 py-2 rounded-lg text-center font-semibold shadow hover:bg-[var(--color-accent)] transition"
              >
                {t("signIn")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
