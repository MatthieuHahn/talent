"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
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

  if (status === "loading" || !session)
    return <div className="container mt-16">Loading...</div>;
  if (error) return <div className="container mt-16 text-red-600">{error}</div>;

  return (
    <div className="container mt-16 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center dark:text-gray-100">
        {t("title") || "Dashboard"}
      </h1>
      <div className="flex justify-end mb-6">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition"
          onClick={() => router.push(`/${locale}/jobs/new`)}
        >
          + Add Job
        </button>
      </div>
      <div className="flex flex-col gap-6">
        {jobs.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            No jobs found.
          </div>
        ) : (
          jobs.map((job: any) => (
            <JobCard
              key={job.id}
              job={job}
              jobMatches={jobMatches}
              matchesLoading={matchesLoading}
              locale={locale}
              onRematch={() => handleRematch(job.id)}
              onClick={() => router.push(`/${locale}/jobs/${job.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
