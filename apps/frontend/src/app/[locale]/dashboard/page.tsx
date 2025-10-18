"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Plus, Briefcase, Users, TrendingUp, Loader2 } from "lucide-react";
import JobCard from "../../../components/jobs/JobCard";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Store match info for each job
  const [jobMatches, setJobMatches] = useState<
    Record<string, { matchedCandidates: number; highestMatchScore: number }>
  >({});
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/" as any);
    }
  }, [session, status, router]);

  useEffect(() => {
    async function fetchJobsAndMatches() {
      setLoading(true);
      setError("");
      try {
        const headers: Record<string, string> = {};
        if (session && (session.user as any)?.access_token) {
          headers["Authorization"] =
            `Bearer ${(session.user as any).access_token}`;
        }
        // Fetch jobs
        const res = await fetch("http://localhost:3001/jobs", { headers });
        if (!res.ok) {
          setError("Could not fetch jobs.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setJobs(data.jobs || []);
        setLoading(false);
        // Fetch matches for each job
        setMatchesLoading(true);
        const matchResults: Record<
          string,
          { matchedCandidates: number; highestMatchScore: number }
        > = {};
        await Promise.all(
          (data.jobs || []).map(async (job: any) => {
            try {
              const matchRes = await fetch(
                `http://localhost:3001/matching/job/${job.id}/candidates?withAi=false`,
                {
                  method: "GET",
                  headers,
                }
              );
              if (!matchRes.ok) return;
              const matches = await matchRes.json();
              matchResults[job.id] = {
                matchedCandidates: matches.length,
                highestMatchScore: matches[0]?.score || 0,
              };
            } catch {
              // ignore
            }
          })
        );
        setJobMatches(matchResults);
        setMatchesLoading(false);
      } catch (err) {
        setError("Could not fetch jobs.");
        setLoading(false);
      }
    }
    if (session && status === "authenticated") fetchJobsAndMatches();
    // Only run when session changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleRematch = async (jobId: string) => {
    if (!jobId) return;
    setMatchesLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = {};
      if (session && (session.user as any)?.access_token) {
        headers["Authorization"] =
          `Bearer ${(session.user as any).access_token}`;
      }
      const matchRes = await fetch(
        `http://localhost:3001/matching/job/${jobId}/candidates?withAi=true&forceRematch=true`,
        {
          method: "GET",
          headers,
        }
      );
      if (!matchRes.ok) {
        setError("Could not re-match candidates.");
        setMatchesLoading(false);
        return;
      }
      const matches = await matchRes.json();
      setJobMatches((prev) => ({
        ...prev,
        [jobId]: {
          matchedCandidates: matches.length,
          highestMatchScore: matches[0]?.score || 0,
        },
      }));
      setMatchesLoading(false);
    } catch {
      setError("Could not re-match candidates.");
      setMatchesLoading(false);
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-6 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Error Loading Dashboard
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

  const totalJobs = jobs.length;
  const totalMatches = Object.values(jobMatches).reduce(
    (sum, match) => sum + match.matchedCandidates,
    0
  );
  const avgMatchScore =
    Object.values(jobMatches).length > 0
      ? Object.values(jobMatches).reduce(
          (sum, match) => sum + match.highestMatchScore,
          0
        ) / Object.values(jobMatches).length
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {t("title") || "Dashboard"}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your job postings and candidate matches
              </p>
            </div>
            <button
              onClick={() => router.push(`/${locale}/jobs/new`)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" />
              Add New Job
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Jobs
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {totalJobs}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Matches
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {totalMatches}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Avg Match Score
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {avgMatchScore > 0 ? `${avgMatchScore.toFixed(0)}%` : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Your Job Postings
            </h2>
            {matchesLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating matches...
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                Loading your jobs...
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No jobs posted yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Get started by creating your first job posting to find the
                perfect candidates.
              </p>
              <button
                onClick={() => router.push(`/${locale}/jobs/new`)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                Create Your First Job
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {jobs.map((job: any) => (
                <JobCard
                  key={job.id}
                  job={job}
                  jobMatches={jobMatches}
                  matchesLoading={matchesLoading}
                  locale={locale}
                  onRematch={() => handleRematch(job.id)}
                  onClick={() => router.push(`/${locale}/jobs/${job.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
