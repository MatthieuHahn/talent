"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Star, Zap, Crown, Gift } from "lucide-react";
import { SubscriptionPlan } from "@talent/types";
import Button from "../../../components/ui/Button";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  interval: "month" | "year";
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  icon: React.ReactNode;
  stripePriceId?: string; // For Stripe integration
}

interface PlanSelectionProps {
  currentPlan?: SubscriptionPlan | null;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  loading?: boolean;
}

export default function PlanSelection({
  currentPlan,
  onSelectPlan,
  loading = false,
}: PlanSelectionProps) {
  const t = useTranslations("billing");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );

  const plans: Plan[] = [
    {
      id: SubscriptionPlan.FREE,
      name: t("freePlanName") || "Free / Essai",
      price: 0,
      interval: "month",
      description:
        t("freePlanDescription") || "Pour tester la plateforme sans engagement",
      icon: <Gift className="h-6 w-6" />,
      features: [
        { name: t("freeFeature1") || "1 recruteur", included: true },
        {
          name: t("freeFeature2") || "2 offres d'emploi maximum",
          included: true,
        },
        {
          name: t("freeFeature3") || "10 CVs uploadés au total",
          included: true,
        },
        {
          name: t("freeFeature4") || "Matching IA limité (20 requêtes/mois)",
          included: true,
        },
        {
          name: t("freeFeature5") || "Accès au tableau de bord de base",
          included: true,
        },
        {
          name: t("proFeature1") || "Jusqu'à 5 recruteurs",
          included: false,
        },
        {
          name: t("proFeature2") || "10 offres d'emploi actives",
          included: false,
        },
        {
          name: t("proFeature3") || "200 CVs uploadés",
          included: false,
        },
      ],
    },
    {
      id: SubscriptionPlan.STARTER,
      name: t("proPlanName") || "Pro",
      price: 49,
      interval: "month",
      description:
        t("proPlanDescription") ||
        "Pour les recruteurs individuels ou petites agences",
      icon: <Star className="h-6 w-6" />,
      features: [
        {
          name: t("proFeature1") || "Jusqu'à 5 recruteurs",
          included: true,
        },
        {
          name: t("proFeature2") || "10 offres d'emploi actives",
          included: true,
        },
        {
          name: t("proFeature3") || "200 CVs uploadés",
          included: true,
        },
        {
          name: t("proFeature4") || "Matching IA illimité",
          included: true,
        },
        {
          name: t("proFeature5") || "Export PDF/CSV des matchings",
          included: true,
        },
        {
          name: t("proFeature6") || "Recherche par mot-clé ou par skill",
          included: true,
        },
        {
          name: t("businessFeature1") || "20 recruteurs",
          included: false,
        },
        {
          name: t("businessFeature2") || "50 offres d'emploi",
          included: false,
        },
      ],
    },
    {
      id: SubscriptionPlan.PROFESSIONAL,
      name: t("businessPlanName") || "Business",
      price: 149,
      interval: "month",
      description:
        t("businessPlanDescription") ||
        "Pour les agences de recrutement ou PME",
      icon: <Zap className="h-6 w-6" />,
      popular: true,
      features: [
        {
          name: t("businessFeature1") || "20 recruteurs",
          included: true,
        },
        {
          name: t("businessFeature2") || "50 offres d'emploi",
          included: true,
        },
        {
          name: t("businessFeature3") || "2000 CVs stockés",
          included: true,
        },
        {
          name: t("businessFeature4") || "IA avancée (embedding + résumés)",
          included: true,
        },
        {
          name:
            t("businessFeature5") ||
            "Gestion multi-entreprises / multi-clients",
          included: true,
        },
        {
          name: t("businessFeature6") || "API Access (intégration ATS / CRM)",
          included: true,
        },
        {
          name: t("businessFeature7") || "Support prioritaire",
          included: true,
        },
        {
          name: t("enterpriseFeature1") || "Utilisateurs illimités",
          included: false,
        },
      ],
    },
    {
      id: SubscriptionPlan.ENTERPRISE,
      name: t("enterprisePlanName") || "Enterprise",
      price: 0,
      interval: "month",
      description:
        t("enterprisePlanDescription") ||
        "Pour les grandes entreprises RH ou agences à volume",
      icon: <Crown className="h-6 w-6" />,
      features: [
        {
          name: t("enterpriseFeature1") || "Utilisateurs illimités",
          included: true,
        },
        {
          name: t("enterpriseFeature2") || "Offres et CVs illimités",
          included: true,
        },
        {
          name:
            t("enterpriseFeature3") || "Matching IA + Fine-tuning personnalisé",
          included: true,
        },
        {
          name: t("enterpriseFeature4") || "Infrastructure dédiée",
          included: true,
        },
        {
          name: t("enterpriseFeature5") || "SLA + Support dédié",
          included: true,
        },
        {
          name:
            t("enterpriseFeature6") ||
            "Intégrations avancées (Greenhouse, Lever...)",
          included: true,
        },
        {
          name: t("enterpriseFeature7") || "Tarif sur demande",
          included: true,
        },
        {
          name: t("enterpriseFeature8") || "Accompagnement sur mesure",
          included: true,
        },
      ],
    },
  ];

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    onSelectPlan(plan);
  };

  const getPlanCardClasses = (plan: Plan) => {
    const baseClasses =
      "relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 transition-all duration-200 hover:shadow-xl hover:-translate-y-1";

    if (plan.popular) {
      return `${baseClasses} ring-2 ring-blue-500 shadow-xl scale-105`;
    }

    if (currentPlan === plan.id) {
      return `${baseClasses} ring-2 ring-green-500 bg-green-50 dark:bg-green-900/10`;
    }

    return `${baseClasses} hover:border-slate-300 dark:hover:border-slate-600`;
  };

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          {t("choosePlan") || "Choisissez votre offre"}
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          {t("planDescription") ||
            "Sélectionnez l'offre qui correspond le mieux à vos besoins en recrutement. Toutes nos offres incluent notre technologie de matching IA."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className={getPlanCardClasses(plan)}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  {t("mostPopular") || "Most Popular"}
                </span>
              </div>
            )}

            {currentPlan === plan.id && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  {t("currentPlanBadge") || "Current Plan"}
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="flex justify-center mb-6">
                <div
                  className={`p-4 rounded-xl ${
                    plan.popular
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : plan.id === SubscriptionPlan.FREE
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {plan.icon}
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {plan.name}
              </h3>

              <div className="mb-2">
                {plan.id === SubscriptionPlan.ENTERPRISE ? (
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {t("contactUs") || "Contact Us"}
                  </div>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      ${plan.price}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      /{plan.interval}
                    </span>
                  </>
                )}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                {plan.description}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      feature.included
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-slate-100 dark:bg-slate-700"
                    }`}
                  >
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" />
                    )}
                  </div>
                  <span
                    className={`text-sm leading-relaxed ${
                      feature.included
                        ? "text-slate-900 dark:text-slate-100"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => handlePlanSelect(plan.id)}
              disabled={loading || currentPlan === plan.id}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5 ${
                plan.popular
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                  : plan.id === SubscriptionPlan.FREE
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                    : plan.id === SubscriptionPlan.ENTERPRISE
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl"
                      : currentPlan === plan.id
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              {loading && selectedPlan === plan.id ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("processing") || "Processing..."}
                </div>
              ) : currentPlan === plan.id ? (
                t("currentPlan") || "Current Plan"
              ) : plan.id === SubscriptionPlan.FREE ? (
                t("startFreeTrial") || "Commencer l'essai gratuit"
              ) : plan.id === SubscriptionPlan.ENTERPRISE ? (
                t("contactSales") || "Nous contacter"
              ) : (
                t("selectPlan") || "Choisir ce plan"
              )}
            </Button>
          </div>
        ))}
      </div>

      {selectedPlan === SubscriptionPlan.ENTERPRISE && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-2">
              {t("customPlanTitle") || "Solution Enterprise Sur Mesure"}
            </h3>
            <p className="text-purple-700 dark:text-purple-300 text-lg">
              {t("customPlanDescription") ||
                "Notre équipe vous accompagne pour une intégration personnalisée adaptée à vos besoins spécifiques. Infrastructure dédiée, SLA garanti, et support prioritaire inclus."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5">
              {t("scheduleCall") || "Planifier un appel"}
            </Button>
            <Button
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/10 font-semibold py-3 px-8 rounded-xl"
            >
              {t("sendEmail") || "Envoyer un email"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
