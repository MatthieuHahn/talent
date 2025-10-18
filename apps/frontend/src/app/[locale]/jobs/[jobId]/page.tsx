"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import StatusSelect from "@/components/ui/StatusSelect";

export default function JobDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const jobId = params?.jobId as string;
  const router = useRouter();

  // Fetch job details from backend
  useEffect(() => {
    async function fetchJob() {
      try {
        const headers: Record<string, string> = {};
        if (session && (session.user as any)?.access_token) {
          headers["Authorization"] =
            `Bearer ${(session.user as any).access_token}`;
        }
        const res = await fetch(`http://localhost:3001/jobs/${jobId}`, {
          headers,
        });
        if (!res.ok) throw new Error("Could not fetch job");
        const data = await res.json();
        setJob(data);
      } catch (err) {
        setJob(null);
      } finally {
        setLoading(false);
      }
    }
    if (session && jobId) fetchJob();
  }, [session, jobId]);
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchedCandidates, setMatchedCandidates] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/" as any);
    }
  }, [session, status, router]);

  // Fetch matched candidates for this job
  useEffect(() => {
    async function fetchMatches() {
      setMatchesLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (session && (session.user as any)?.access_token) {
          headers["Authorization"] =
            `Bearer ${(session.user as any).access_token}`;
        }
        // First, try to fetch matches (non-AI)
        const res = await fetch(
          `http://localhost:3001/matching/job/${jobId}/candidates?useAi=false`,
          {
            method: "GET",
            headers,
          }
        );
        if (!res.ok) throw new Error("Could not fetch matches");
        const data = await res.json();
        // If no matches, launch AI matching and refetch
        if (Array.isArray(data) && data.length === 0) {
          try {
            await fetch(
              `http://localhost:3001/matching/job/${jobId}/candidates?useAi=true`,
              {
                method: "POST",
                headers,
              }
            );
            // Refetch matches after AI matching
            const aiRes = await fetch(
              `http://localhost:3001/matching/job/${jobId}/candidates?useAi=false`,
              {
                method: "GET",
                headers,
              }
            );
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              setMatchedCandidates(aiData);
            } else {
              setMatchedCandidates([]);
            }
          } catch (err) {
            setMatchedCandidates([]);
          }
        } else {
          setMatchedCandidates(data);
        }
      } catch (err) {
        setMatchedCandidates([]);
      } finally {
        setMatchesLoading(false);
      }
    }
    if (session && jobId) fetchMatches();
  }, [session, jobId]);

  return (
    <div className="container mt-16 max-w-3xl mx-auto">
      {/* Job description block */}
      {loading ? (
        <div className="mb-6 text-gray-500">Loading job...</div>
      ) : error ? (
        <div className="mb-6 text-red-600">{error}</div>
      ) : job ? (
        <div className="mb-8 p-6 rounded-lg bg-white dark:bg-zinc-900 shadow">
          <h1 className="text-3xl font-bold mb-2 dark:text-gray-100">
            {job.title}
          </h1>
          <div className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            {job.company?.name}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Status:</span> {job.status}
            {job.level && (
              <span className="ml-2 font-semibold">Level:</span>
            )}{" "}
            {job.level}
            {job.type && <span className="ml-2 font-semibold">Type:</span>}{" "}
            {job.type}
            {job.remote && <span className="ml-2 font-semibold">Remote</span>}
          </div>
          {job.description && (
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
              {job.description}
            </div>
          )}
          {job.jobDescriptionUrl && (
            <div className="mt-4">
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-semibold shadow"
                onClick={async () => {
                  try {
                    const headers: Record<string, string> = {};
                    if (session && (session.user as any)?.access_token) {
                      headers["Authorization"] =
                        `Bearer ${(session.user as any).access_token}`;
                    }
                    const res = await fetch(
                      `http://localhost:3001/jobs/${jobId}/job-description-url`,
                      {
                        headers,
                      }
                    );
                    if (!res.ok) throw new Error("Could not get download link");
                    const data = await res.json();
                    if (data.url) {
                      window.open(data.url, "_blank");
                    }
                  } catch (err) {
                    alert("Failed to get download link");
                  }
                }}
              >
                Download Job Description PDF
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : null}

      <h2 className="text-2xl font-bold mb-6">Matched Candidates</h2>
      {matchesLoading ? (
        <div className="mt-2 text-gray-500">Loading matched candidates...</div>
      ) : matchedCandidates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {matchedCandidates.map((match, idx) => (
            <div
              key={match.candidateId || idx}
              className="rounded-lg shadow p-6 bg-gray-50 dark:bg-zinc-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-lg">
                    {match.candidate.firstName} {match.candidate.lastName}
                  </span>
                  {match.candidate.email && (
                    <span className="ml-2 text-xs text-gray-500">
                      {match.candidate.email}
                    </span>
                  )}
                  {match.candidate.phone && (
                    <span className="ml-2 text-xs text-gray-500">
                      | {match.candidate.phone}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusSelect
                    value={match.application?.status || "APPLIED"}
                    onChange={async (newStatus) => {
                      // optimistic UI
                      const prev = match.application?.status;
                      try {
                        // Call backend
                        const headers: Record<string, string> = {
                          "Content-Type": "application/json",
                        };
                        if (session && (session.user as any)?.access_token) {
                          headers["Authorization"] =
                            `Bearer ${(session.user as any).access_token}`;
                        }
                        const res = await fetch(
                          `http://localhost:3001/matching/job/${jobId}/candidate/${match.candidate.id}/status`,
                          {
                            method: "PATCH",
                            headers,
                            body: JSON.stringify({ status: newStatus }),
                          }
                        );
                        if (!res.ok) throw new Error("Update failed");
                        // Update local state
                        setMatchedCandidates((prevArr) =>
                          prevArr.map((m) =>
                            m.candidateId === match.candidateId
                              ? {
                                  ...m,
                                  application: {
                                    ...(m.application || {}),
                                    status: newStatus,
                                  },
                                }
                              : m
                          )
                        );
                      } catch (err) {
                        // revert handled in StatusSelect but ensure array is updated back
                        setMatchedCandidates((prevArr) =>
                          prevArr.map((m) =>
                            m.candidateId === match.candidateId
                              ? {
                                  ...m,
                                  application: {
                                    ...(m.application || {}),
                                    status: prev,
                                  },
                                }
                              : m
                          )
                        );
                        console.error(err);
                      }
                    }}
                  />
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Score: {match.score?.toFixed(0)}%
                  </span>
                </div>
              </div>
              {/* Matched Skills as tags */}
              <div className="mt-2 text-xs">
                <span className="font-semibold">Matched Skills:</span>{" "}
                <div className="flex flex-wrap gap-2 mt-1">
                  {match.skillMatches?.matched?.length ? (
                    match.skillMatches.matched.map(
                      (skill: string, i: number) => (
                        <span
                          key={skill + i}
                          className="inline-block px-2 py-1 rounded bg-green-200 text-green-900 text-xs font-medium dark:bg-green-900 dark:text-green-200"
                        >
                          {skill}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </div>
              </div>
              {/* Missing Skills as tags */}
              <div className="mt-1 text-xs">
                <span className="font-semibold">Missing Skills:</span>{" "}
                <div className="flex flex-wrap gap-2 mt-1">
                  {match.skillMatches?.missing?.length ? (
                    match.skillMatches.missing.map(
                      (skill: string, i: number) => (
                        <span
                          key={skill + i}
                          className="inline-block px-2 py-1 rounded bg-red-200 text-red-900 text-xs font-medium dark:bg-red-900 dark:text-red-200"
                        >
                          {skill}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </div>
              </div>
              {/* Additional Skills as tags */}
              <div className="mt-2 text-xs">
                <span className="font-semibold">Additional Skills:</span>{" "}
                <div className="flex flex-wrap gap-2 mt-1">
                  {match.skillMatches?.additional?.length ? (
                    match.skillMatches.additional.map(
                      (skill: string, i: number) => (
                        <span
                          key={skill + i}
                          className="inline-block px-2 py-1 rounded bg-blue-200 text-blue-900 text-xs font-medium dark:bg-blue-900 dark:text-blue-200"
                        >
                          {skill}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </div>
              </div>
              {match.aiAnalysis && (
                <div className="mt-4 p-4 rounded-xl border border-purple-300 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-zinc-900 shadow">
                  <div className="flex items-center mb-2">
                    <span className="inline-block mr-2 text-purple-700 dark:text-purple-200">
                      <svg
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14.5A6.5 6.5 0 1110 3.5a6.5 6.5 0 010 13z" />
                        <circle cx="10" cy="10" r="3" />
                      </svg>
                    </span>
                    <span className="font-bold text-lg text-purple-800 dark:text-purple-200">
                      AI Analysis
                    </span>
                    <span className="ml-auto px-2 py-1 rounded-full text-xs font-semibold bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200">
                      {match.aiAnalysis.overallMatch}% match
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mb-2">
                    <div className="flex-1 min-w-[120px]">
                      <div className="font-semibold text-xs text-green-700 dark:text-green-300 mb-1 flex items-center">
                        <span className="mr-1">🟢</span> Strengths
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {match.aiAnalysis.strengths?.length ? (
                          match.aiAnalysis.strengths.map(
                            (s: string, i: number) => (
                              <span
                                key={s + i}
                                className="inline-block px-2 py-1 rounded bg-green-100 text-green-900 text-xs font-medium dark:bg-green-900 dark:text-green-200"
                              >
                                {s}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <div className="font-semibold text-xs text-red-700 dark:text-red-300 mb-1 flex items-center">
                        <span className="mr-1">🔴</span> Weaknesses
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {match.aiAnalysis.weaknesses?.length ? (
                          match.aiAnalysis.weaknesses.map(
                            (w: string, i: number) => (
                              <span
                                key={w + i}
                                className="inline-block px-2 py-1 rounded bg-red-100 text-red-900 text-xs font-medium dark:bg-red-900 dark:text-red-200"
                              >
                                {w}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="font-semibold text-purple-700 dark:text-purple-200">
                      Reasoning:
                    </span>
                    <span className="ml-2 text-gray-700 dark:text-gray-200">
                      {match.aiAnalysis.reasoning}
                    </span>
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="font-semibold text-purple-700 dark:text-purple-200">
                      Recommendation:
                    </span>
                    <span className="ml-2 text-gray-700 dark:text-gray-200">
                      {match.aiAnalysis.recommendation}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-gray-500">
          No candidates matched for this job.
        </div>
      )}
    </div>
  );
}
