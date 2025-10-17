'use client';

import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="bg-[var(--color-card)] border-t border-[var(--color-border)] py-8 mt-20">
      <div className="max-w-7xl mx-auto px-6 text-center text-[var(--color-secondary)]">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} AI Recruiting CRM. All rights reserved.
        </p>
        <div className="mt-2 flex justify-center gap-4 text-[var(--color-primary)]">
          <a href="/privacy" className="hover:text-[var(--color-accent)] transition">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-[var(--color-accent)] transition">
            Terms of Service
          </a>
          <a href="/contact" className="hover:text-[var(--color-accent)] transition">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
