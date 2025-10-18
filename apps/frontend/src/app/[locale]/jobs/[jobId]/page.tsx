"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Download,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Briefcase,
  Building,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  AlertCircle,
  Star,
} from "lucide-react";
import StatusSelect from "@/components/ui/StatusSelect";
import { Job, Candidate } from "@talent/types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export default function JobDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const jobId = params?.jobId as string;
  const router = useRouter();
  const locale = useLocale();

  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchedCandidates, setMatchedCandidates] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace(`/${locale}`);
    }
  }, [session, status, router]);

  // Fetch job details from backend
  useEffect(() => {
    async function fetchJob() {
      try {
        const headers: Record<string, string> = {};
        if (session && (session.user as any)?.access_token) {
          headers["Authorization"] =
            `Bearer ${(session.user as any).access_token}`;
        }
        const res = await fetch(`${BACKEND_URL}/jobs/${jobId}`, {
          headers,
        });
        if (!res.ok) throw new Error("Could not fetch job");
        const data = await res.json();
        setJob(data);
      } catch (err) {
        setJob(null);
        setError("Failed to load job details");
      } finally {
        setLoading(false);
      }
    }
    if (session && jobId) fetchJob();
  }, [session, jobId]);

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
          `${BACKEND_URL}/matching/job/${jobId}/candidates?useAi=false`,
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
              `${BACKEND_URL}/matching/job/${jobId}/candidates?useAi=true`,
              {
                method: "POST",
                headers,
              }
            );
            // Refetch matches after AI matching
            const aiRes = await fetch(
              `${BACKEND_URL}/matching/job/${jobId}/candidates?useAi=false`,
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

  const handleDownloadJobDescription = async () => {
    try {
      const headers: Record<string, string> = {};
      if (session && (session.user as any)?.access_token) {
        headers["Authorization"] =
          `Bearer ${(session.user as any).access_token}`;
      }
      const res = await fetch(
        `${BACKEND_URL}/jobs/${jobId}/job-description-url`,
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
  };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading job details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Error Loading Job
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {/* Job Header Card */}
          {loading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ) : job ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                    {job.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400 mb-4">
                    {job.company?.name && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="font-medium">{job.company.name}</span>
                      </div>
                    )}
                    {job.createdAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 mb-6">
                    {job.status && (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          job.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        <Briefcase className="h-4 w-4 mr-1" />
                        {job.status}
                      </span>
                    )}
                    {job.level && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {job.level}
                      </span>
                    )}
                    {job.type && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        {job.type}
                      </span>
                    )}
                    {job.remote && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <MapPin className="h-4 w-4 mr-1" />
                        Remote
                      </span>
                    )}
                  </div>

                  {job.description && (
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 whitespace-pre-line">
                      {job.description}
                    </div>
                  )}

                  {/* Skills Section */}
                  {(job.requirementsDetailed?.skills || job.skills) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                        Required Skills
                      </h3>

                      {/* Technical Skills */}
                      {job.requirementsDetailed?.skills?.technical?.length >
                        0 && (
                        <div className="mb-4">
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2 block">
                            Technical Skills
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {job.requirementsDetailed.skills.technical.map(
                              (skill: string, idx: number) => (
                                <span
                                  key={"tech-" + idx}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                >
                                  {skill}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Soft Skills */}
                      {job.requirementsDetailed?.skills?.soft?.length > 0 && (
                        <div>
                          <span className="text-sm font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-2 block">
                            Soft Skills
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {job.requirementsDetailed.skills.soft.map(
                              (skill: string, idx: number) => (
                                <span
                                  key={"soft-" + idx}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                >
                                  {skill}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 lg:min-w-[200px]">
                  {job.jobDescriptionUrl && (
                    <button
                      onClick={handleDownloadJobDescription}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Download className="h-5 w-5" />
                      Download PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Matched Candidates Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Matched Candidates
              </h2>
              {matchesLoading && (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              )}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {matchedCandidates.length} candidate
              {matchedCandidates.length !== 1 ? "s" : ""} found
            </div>
          </div>

          {matchesLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                Finding the best candidates...
              </p>
            </div>
          ) : matchedCandidates.length > 0 ? (
            <div className="grid gap-6">
              {matchedCandidates.map((match, idx) => (
                <CandidateCard
                  key={match.candidateId || idx}
                  match={match}
                  jobId={jobId}
                  session={session}
                  onStatusChange={(newStatus) => {
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
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No candidates matched yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                We&apos;re working on finding the perfect candidates for this
                position. Check back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Candidate Card Component
function CandidateCard({
  match,
  jobId,
  session,
  onStatusChange,
}: {
  match: any;
  jobId: string;
  session: any;
  onStatusChange: (status: string) => void;
}) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session && (session.user as any)?.access_token) {
        headers["Authorization"] =
          `Bearer ${(session.user as any).access_token}`;
      }
      const res = await fetch(
        `${BACKEND_URL}/matching/job/${jobId}/candidate/${match.candidate.id}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error("Update failed");
      onStatusChange(newStatus);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Candidate Info */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {match.candidate.firstName} {match.candidate.lastName}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                {match.candidate.email && <span>{match.candidate.email}</span>}
                {match.candidate.phone && <span>{match.candidate.phone}</span>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusSelect
                value={match.application?.status || "APPLIED"}
                onChange={handleStatusChange}
                disabled={updating}
                className="min-w-[140px]"
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Star className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-800 dark:text-green-300">
                  {match.score?.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Skills Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Matched Skills */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Matched Skills
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {match.skillMatches?.matched?.length ? (
                  match.skillMatches.matched.map((skill: string, i: number) => (
                    <span
                      key={skill + i}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    None
                  </span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Missing Skills
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {match.skillMatches?.missing?.length ? (
                  match.skillMatches.missing.map((skill: string, i: number) => (
                    <span
                      key={skill + i}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    None
                  </span>
                )}
              </div>
            </div>

            {/* Additional Skills */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Plus className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  Additional Skills
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {match.skillMatches?.additional?.length ? (
                  match.skillMatches.additional.map(
                    (skill: string, i: number) => (
                      <span
                        key={skill + i}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      >
                        {skill}
                      </span>
                    )
                  )
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    None
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          {match.aiAnalysis && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                      AI Analysis
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Overall Match: {match.aiAnalysis.overallMatch}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Strengths */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Strengths
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {match.aiAnalysis.strengths?.length ? (
                      match.aiAnalysis.strengths.map((s: string, i: number) => (
                        <span
                          key={s + i}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        None identified
                      </span>
                    )}
                  </div>
                </div>

                {/* Weaknesses */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                      Areas for Improvement
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {match.aiAnalysis.weaknesses?.length ? (
                      match.aiAnalysis.weaknesses.map(
                        (w: string, i: number) => (
                          <span
                            key={w + i}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800"
                          >
                            {w}
                          </span>
                        )
                      )
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        None identified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-purple-200 dark:border-purple-800">
                <div>
                  <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Analysis:
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {match.aiAnalysis.reasoning}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Recommendation:
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {match.aiAnalysis.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
