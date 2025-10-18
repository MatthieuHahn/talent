"use client";

import { useTranslations } from "next-intl";

export default function BillingPage() {
  const t = useTranslations("billing");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {t("title") || "Billing & Subscription"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Billing Coming Soon
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              We're working hard to bring you a comprehensive billing and
              subscription management system. This feature will be available
              soon with full Stripe integration for secure payments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg px-6 py-3">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Expected Features:
                </div>
                <ul className="text-sm text-slate-900 dark:text-slate-100 mt-2 space-y-1">
                  <li>• Secure payment processing</li>
                  <li>• Subscription management</li>
                  <li>• Invoice history</li>
                  <li>• Plan upgrades/downgrades</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
