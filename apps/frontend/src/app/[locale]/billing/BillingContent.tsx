"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Button from "../../../components/ui/Button";
import PlanSelection from "./PlanSelection";
import { stripeApi } from "../../../lib/stripe";
import {
  Subscription,
  Payment,
  Invoice,
  SubscriptionStatus,
  PaymentStatus,
  SubscriptionPlan,
} from "@talent/types";

export default function BillingContent() {
  const t = useTranslations("billing");
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<{
    type: "success" | "canceled" | null;
    message: string;
  }>({ type: null, message: "" });

  useEffect(() => {
    // Check for checkout success/cancel parameters
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      setCheckoutStatus({
        type: "success",
        message:
          t("subscriptionCreated") || "Subscription created successfully!",
      });
    } else if (canceled === "true") {
      setCheckoutStatus({
        type: "canceled",
        message: "Payment was canceled. You can try again anytime.",
      });
    }

    loadBillingData();
  }, [searchParams]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [subscriptionRes, paymentsRes, invoicesRes] = await Promise.all([
        stripeApi.getSubscription(),
        stripeApi.getPaymentHistory(),
        stripeApi.getInvoices(),
      ]);

      setSubscription(subscriptionRes.subscription);
      setPayments(paymentsRes.payments);
      setInvoices(invoicesRes.invoices);
    } catch (error) {
      console.error("Failed to load billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm(t("confirmCancel"))) return;

    try {
      setActionLoading(true);
      await stripeApi.cancelSubscription();
      await loadBillingData(); // Refresh data
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      alert(t("cancelError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    if (plan === SubscriptionPlan.ENTERPRISE) {
      // Handle enterprise plan - redirect to contact
      window.open(
        "mailto:sales@talentcrm.com?subject=Enterprise Plan Inquiry",
        "_blank"
      );
      return;
    }

    // Map plans to Stripe price IDs
    const priceIdMap: Record<SubscriptionPlan, string | null> = {
      [SubscriptionPlan.FREE]: null, // Free plan doesn't need payment
      [SubscriptionPlan.STARTER]: "price_1QJ8w1Jn1pQBEDVn8Y8wQXK", // $49/month Pro plan
      [SubscriptionPlan.PROFESSIONAL]: "price_1QJ8x1Jn1pQBEDVnKQ8wQXK", // $149/month Business plan
      [SubscriptionPlan.ENTERPRISE]: "price_1QJ8y1Jn1pQBEDVnKQ8wQXK", // Custom Enterprise plan
      [SubscriptionPlan.CUSTOM]: null, // Custom plan handled separately
    };

    const priceId = priceIdMap[plan];
    if (!priceId) {
      if (plan === SubscriptionPlan.FREE) {
        // Handle free plan - could set up trial or just confirm
        alert(t("startFreeTrial") || "Starting free trial...");
        return;
      }
      alert(t("planNotAvailable") || "This plan is not currently available.");
      return;
    }

    try {
      setActionLoading(true);

      // Create checkout session
      const response = await stripeApi.createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing?canceled=true`,
      });

      // Redirect to Stripe Checkout
      window.location.href = response.session.url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      alert(
        t("planSelectError") || "Failed to start checkout. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return "text-green-600 bg-green-100";
      case SubscriptionStatus.PAST_DUE:
        return "text-red-600 bg-red-100";
      case SubscriptionStatus.CANCELED:
        return "text-gray-600 bg-gray-100";
      case SubscriptionStatus.TRIALING:
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert from cents
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">
            {t("loading") || "Loading billing information..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Checkout Status Messages */}
      {checkoutStatus.type && (
        <div
          className={`p-4 rounded-lg border ${
            checkoutStatus.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/10 dark:border-green-800 dark:text-green-200"
              : "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-800 dark:text-yellow-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex-shrink-0 ${
                checkoutStatus.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {checkoutStatus.type === "success" ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="text-sm font-medium">{checkoutStatus.message}</p>
            <button
              onClick={() => setCheckoutStatus({ type: null, message: "" })}
              className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Plan Selection - Show if no active subscription */}
      {!subscription && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
          <PlanSelection
            currentPlan={null}
            onSelectPlan={handlePlanSelect}
            loading={actionLoading}
          />
        </div>
      )}

      {/* Current Subscription */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">
          {t("currentPlan") || "Current Plan"}
        </h2>

        {subscription ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {t("planStatus") || "Plan Status"}
                </p>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(subscription.status)}`}
                >
                  {subscription.status}
                </span>
              </div>

              {subscription.status === SubscriptionStatus.ACTIVE && (
                <Button
                  onClick={handleCancelSubscription}
                  disabled={actionLoading}
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/10"
                >
                  {actionLoading
                    ? t("cancelling") || "Cancelling..."
                    : t("cancelPlan") || "Cancel Plan"}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("currentPeriod") || "Current Period"}
                </p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatDate(subscription.currentPeriodStart)} -{" "}
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>

              {subscription.trialEnd && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t("trialEnds") || "Trial Ends"}
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatDate(subscription.trialEnd)}
                  </p>
                </div>
              )}
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="text-yellow-600 dark:text-yellow-400">
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    {t("cancelAtPeriodEnd", {
                      date: formatDate(subscription.currentPeriodEnd),
                    }) ||
                      `Your subscription will be cancelled on ${formatDate(subscription.currentPeriodEnd)}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {t("noActiveSubscription") || "No Active Subscription"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {t("billing.noSubscriptionDescription") ||
                "Choose a plan below to get started with our AI-powered recruiting platform."}
            </p>
            <Button
              onClick={() =>
                document
                  .getElementById("plan-selection")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {t("choosePlan") || "Choose Your Plan"}
            </Button>
          </div>
        )}
      </div>

      {/* Plan Management - Show for existing subscribers */}
      {subscription && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">
            {t("managePlan") || "Manage Plan"}
          </h2>
          <div className="space-y-6">
            <p className="text-slate-600 dark:text-slate-400">
              {t("changePlanDescription") ||
                "Need to change your plan? Contact our support team for assistance with plan upgrades or downgrades."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setShowPlanSelection(!showPlanSelection)}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/10"
              >
                {showPlanSelection
                  ? t("hidePlans") || "Hide Plans"
                  : t("viewAllPlans") || "View All Plans"}
              </Button>
              <Button
                onClick={() =>
                  window.open(
                    "mailto:support@talentcrm.com?subject=Plan Change Request",
                    "_blank"
                  )
                }
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/10"
              >
                {t("contactSupport") || "Contact Support"}
              </Button>
            </div>

            {showPlanSelection && (
              <div
                id="plan-selection"
                className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700"
              >
                <PlanSelection
                  currentPlan={null} // TODO: Map stripePriceId to plan enum
                  onSelectPlan={handlePlanSelect}
                  loading={actionLoading}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">
          {t("paymentHistory") || "Payment History"}
        </h2>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("date") || "Date"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("amount") || "Amount"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("status") || "Status"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("description") || "Description"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === PaymentStatus.SUCCEEDED
                            ? "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                            : payment.status === PaymentStatus.FAILED
                              ? "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                              : "text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {payment.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {t("noPayments") || "No Payments Yet"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {t("billing.noPaymentsDescription") ||
                "Your payment history will appear here once you make a payment."}
            </p>
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">
          {t("invoices") || "Invoices"}
        </h2>

        {invoices.length > 0 ? (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-6 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {t("invoice") || "Invoice"} #
                      {invoice.stripeInvoiceId.slice(-8)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(invoice.periodStart)} -{" "}
                      {formatDate(invoice.periodEnd)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {invoice.status}
                    </p>
                  </div>
                  {invoice.hostedInvoiceUrl && (
                    <a
                      href={invoice.hostedInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                    >
                      {t("viewInvoice") || "View"}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {t("noInvoices") || "No Invoices Yet"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {t("billing.noInvoicesDescription") ||
                "Your invoices will appear here once billing begins."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
