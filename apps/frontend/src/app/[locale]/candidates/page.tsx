"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  Plus,
  Users,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Star,
  TrendingUp,
  Loader2,
  AlertCircle,
  UserPlus,
  Search,
} from "lucide-react";
import { Candidate, CandidateStatus } from "@talent/types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// Extended type for API responses that includes computed fields
type CandidateWithStats = Candidate & {
  matchedJobsCount?: number;
  appliedJobsCount?: number;
};

type CandidateResponse = {
  candidates: CandidateWithStats[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export default function CandidatesPage() {
  const t = useTranslations("candidates");
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [candidates, setCandidates] = useState<CandidateResponse>({
    candidates: [],
    limit: 0,
    page: 0,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Auth guard
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/" as any);
    }
  }, [session, status, router]);

  useEffect(() => {
    async function fetchCandidates() {
      setLoading(true);
      setError("");
      try {
        const headers: Record<string, string> = {};
        if (session && (session.user as any)?.access_token) {
          headers["Authorization"] =
            `Bearer ${(session.user as any).access_token}`;
        }
        const res = await fetch(`${BACKEND_URL}/candidates`, {
          headers,
        });
        if (!res.ok) {
          setError(t("listError") || "Failed to load candidates");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCandidates(data);
        setLoading(false);
      } catch (err) {
        setError(t("listError") || "Failed to load candidates");
        setLoading(false);
      }
    }
    if (session) fetchCandidates();
  }, [t, session]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading candidates...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Error Loading Candidates
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {t("title") || "Candidates"}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your candidate database and track applications
              </p>
            </div>
            <button
              onClick={() => router.push(`/${locale}/candidates/new`)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <UserPlus className="h-5 w-5" />
              Add New Candidate
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Candidates
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {candidates.total}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Active Candidates
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {
                      candidates.candidates.filter(
                        (c) => c.status === CandidateStatus.ACTIVE
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Applications
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {candidates.candidates.reduce(
                      (sum, c) => sum + (c.appliedJobsCount || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Candidates Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                All Candidates
              </h2>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {candidates.total} candidate{candidates.total !== 1 ? "s" : ""}{" "}
              found
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                Loading candidates...
              </p>
            </div>
          ) : candidates.candidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No candidates yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Start building your candidate database by adding your first
                candidate.
              </p>
              <button
                onClick={() => router.push(`/${locale}/candidates/new`)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <UserPlus className="h-5 w-5" />
                Add Your First Candidate
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.candidates.map((candidate: Candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() =>
                    router.push(`/${locale}/candidates/${candidate.id}`)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Candidate Card Component
function CandidateCard({
  candidate,
  onClick,
}: {
  candidate: Candidate;
  onClick: () => void;
}) {
  return (
    <div
      className="bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 mb-1">
            {candidate.firstName} {candidate.lastName}
          </h3>
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 mb-2">
            <Mail className="h-4 w-4" />
            <span className="text-sm">{candidate.email}</span>
          </div>
          {candidate.phone && (
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 mb-3">
              <Phone className="h-4 w-4" />
              <span className="text-sm">{candidate.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-semibold text-green-800 dark:text-green-300">
            {candidate.matchedJobsCount ?? 0} matches
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">
            {candidate.appliedJobsCount ?? 0} applied
          </span>
        </div>
      </div>

      {/* Status and Experience */}
      <div className="flex flex-wrap gap-2 mb-4">
        {candidate.status && (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              candidate.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            <div className="w-2 h-2 bg-current rounded-full mr-2"></div>
            {candidate.status}
          </span>
        )}
        {candidate.yearsOfExperience && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Star className="h-4 w-4 mr-1" />
            {candidate.yearsOfExperience} yrs exp
          </span>
        )}
      </div>

      {/* Tags */}
      {candidate.tags && candidate.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {candidate.tags.slice(0, 4).map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-500"
            >
              {tag}
            </span>
          ))}
          {candidate.tags.length > 4 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
              +{candidate.tags.length - 4} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
