"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMessages } from "next-intl";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Download,
  Copy,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Star,
  TrendingUp,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
  Building,
} from "lucide-react";

type JobMatch = {
  id?: string;
  jobId?: string;
  job?: {
    id?: string;
    title?: string;
    company?: string;
    location?: string;
    description?: string;
  };
  score?: number;
  embeddingSimilarity?: number;
  aiAnalysis?: any;
  skillMatches?: any;
};

export default function CandidateDetailPage() {
  const t = useMessages();
  const { id, locale } = useParams() as { id?: string; locale?: string };
  const router = useRouter();
  const { data: session } = useSession();

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "jobs" | "activity">("overview");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const headers: Record<string, string> = {};
        if (session && (session.user as any)?.access_token) {
          headers["Authorization"] =
            `Bearer ${(session.user as any).access_token}`;
        }
        const res = await fetch(`http://localhost:3001/candidates/${id}`, {
          headers,
        });
        if (!res.ok) {
          if (mounted)
            setError(t["candidate.notFound"] || "Candidate not found.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (mounted) setCandidate(data);
      } catch (err) {
        if (mounted)
          setError(t["candidate.notFound"] || "Candidate not found.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id && session) load();
    return () => {
      mounted = false;
    };
  }, [id, session, t]);

  const jobs: JobMatch[] = useMemo(() => {
    if (!candidate) return [];
    if (Array.isArray(candidate.jobs) && candidate.jobs.length > 0)
      return candidate.jobs;
    return candidate.matchingResults || [];
  }, [candidate]);

  const skillsList: string[] = useMemo(() => {
    const raw = candidate?.skills ?? candidate?.skillTags;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      // try JSON parse, otherwise split by comma
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // not JSON, fallback to comma split
        return raw.split(/\s*,\s*/).filter(Boolean);
      }
      return [];
    }
    if (typeof raw === "object") {
      // If it's an object containing arrays or string values, try to extract
      // common shapes: { skills: ['a','b'] } or { 0: 'a', 1: 'b' }
      if (Array.isArray((raw as any).skills)) return (raw as any).skills;
      const vals = Object.values(raw as any).flatMap((v: any) =>
        Array.isArray(v) ? v : typeof v === "string" ? [v] : []
      );
      return vals.map(String);
    }
    return [];
  }, [candidate]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(candidate.email || "");
    // Could add a toast notification here
  };

  const handleDownloadResume = async () => {
    try {
      const headers: Record<string, string> = {};
      if (session && (session.user as any)?.access_token)
        headers["Authorization"] =
          `Bearer ${(session.user as any).access_token}`;
      const res = await fetch(
        `http://localhost:3001/candidates/${id}/resume-url`,
        { headers }
      );
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      window.open(data.url, "_blank");
    } catch {
      alert("Could not download resume");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading candidate details...
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
            Candidate Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  const profileCompleteness = Math.min(
    100,
    Math.round((Object.keys(candidate || {}).length / 20) * 100)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Candidates
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 sticky top-8">
              {/* Avatar and Basic Info */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
                  {(candidate.firstName?.[0] || "") +
                    (candidate.lastName?.[0] || "")}
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                  {candidate.title ||
                    candidate.currentTitle ||
                    "No title specified"}
                </p>
                {candidate.location && (
                  <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
                    <MapPin className="h-4 w-4" />
                    {candidate.location}
                  </div>
                )}
              </div>

              {/* Profile Completeness */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    Profile Completeness
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {profileCompleteness}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileCompleteness}%` }}
                  ></div>
                </div>
              </div>

              {/* Tags */}
              {candidate.tags && candidate.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.tags.slice(0, 8).map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Contact
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {candidate.email}
                    </span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {candidate.phone}
                      </span>
                    </div>
                  )}
                  {candidate.linkedin && (
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                      <a
                        href={candidate.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {skillsList.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.slice(0, 12).map((skill: string) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Availability
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {candidate.availability || "Not specified"}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {candidate.resumeUrl && (
                  <button
                    onClick={handleDownloadResume}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Download className="h-4 w-4" />
                    Download Resume
                  </button>
                )}
                <button
                  onClick={handleCopyEmail}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-medium rounded-lg transition-colors duration-200"
                >
                  <Copy className="h-4 w-4" />
                  Copy Email
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              {/* Tabs */}
              <div className="flex items-center gap-1 mb-6 border-b border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setTab("overview")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    tab === "overview"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setTab("jobs")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    tab === "jobs"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  Jobs ({jobs.length})
                </button>
                <button
                  onClick={() => setTab("activity")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    tab === "activity"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-100"
                  }`}
                >
                  Activity
                </button>
              </div>

              {/* Tab Content */}
              {tab === "overview" && (
                <div className="space-y-8">
                  {/* Professional Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Professional Summary
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {candidate.summary || "No summary provided."}
                      </p>
                    </div>
                  </div>

                  {/* Experience and Education Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Experience */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Experience
                      </h3>
                      <div className="space-y-4">
                        {(candidate.experience || []).map(
                          (exp: any, i: number) => (
                            <div
                              key={i}
                              className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                    {exp.title}
                                  </h4>
                                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                                    {exp.company}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
                                  <Calendar className="h-4 w-4" />
                                  {exp.startDate} — {exp.endDate || "Present"}
                                </div>
                              </div>
                              {exp.description && (
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          )
                        )}
                        {(!candidate.experience ||
                          candidate.experience.length === 0) && (
                          <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                            No experience information available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Education & Certifications */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Education & Certifications
                      </h3>
                      <div className="space-y-4">
                        {/* Education */}
                        {(candidate.education || []).map(
                          (edu: any, i: number) => (
                            <div
                              key={i}
                              className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4"
                            >
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                {edu.degree}
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                                {edu.institution}
                              </p>
                              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
                                <Calendar className="h-4 w-4" />
                                {edu.startDate} — {edu.endDate}
                              </div>
                            </div>
                          )
                        )}

                        {/* Certifications */}
                        {(candidate.certifications || []).map(
                          (cert: any, i: number) => (
                            <div
                              key={`cert-${i}`}
                              className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                  {cert.name}
                                </h4>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Issued by {cert.issuer}
                              </p>
                            </div>
                          )
                        )}

                        {(!candidate.education ||
                          candidate.education.length === 0) &&
                          (!candidate.certifications ||
                            candidate.certifications.length === 0) && (
                            <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                              No education or certification information
                              available
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "jobs" && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Matched Jobs
                  </h3>

                  {jobs.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                        No matched jobs available
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400">
                        This candidate hasn't been matched with any jobs yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {jobs.map((match: JobMatch, idx: number) => {
                        const jid = match.jobId || match.job?.id;
                        const app = (candidate.applications || []).find(
                          (a: any) => a.jobId === jid
                        );
                        const score =
                          Math.round((match.score || 0) * 100) / 100;
                        const sim =
                          Math.round((match.embeddingSimilarity || 0) * 100) /
                          100;
                        const skills = (
                          match.skillMatches?.matched || []
                        ).slice(0, 6);

                        return (
                          <div
                            key={match.id || idx}
                            className="bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 p-6 hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <a
                                  href={`/${locale || ""}/jobs/${jid}`}
                                  className="text-lg font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 block mb-1"
                                >
                                  {match.job?.title || "Untitled role"}
                                </a>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Building className="h-4 w-4" />
                                  {match.job?.company}
                                  {match.job?.location && (
                                    <>
                                      <span>•</span>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {match.job.location}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-full">
                                  <Star className="h-4 w-4" />
                                  {score}
                                </div>
                                {app ? (
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                      app.status === "OFFER_ACCEPTED"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : app.status === "REJECTED"
                                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    }`}
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    {app.status}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                    Match Only
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* AI Analysis */}
                            {(match.aiAnalysis?.summary ||
                              match.aiAnalysis?.recommendation) && (
                              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                                    AI Analysis
                                  </span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {match.aiAnalysis.summary ||
                                    match.aiAnalysis.recommendation}
                                </p>
                              </div>
                            )}

                            {/* Matched Skills */}
                            {skills.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                  Matched Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {skills.map((skill: string) => (
                                    <span
                                      key={skill}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-600">
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Similarity:{" "}
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  {sim}
                                </span>
                              </div>
                              <a
                                href={`/${locale || ""}/jobs/${jid}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                              >
                                View Job
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === "activity" && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </h3>

                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6">
                    {(candidate.activity || []).length > 0 ? (
                      <ul className="space-y-4">
                        {(candidate.activity || [])
                          .slice(0, 10)
                          .map((activity: any, i: number) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <p className="text-slate-700 dark:text-slate-300 text-sm">
                                  {activity.text}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                  {activity.date}
                                </p>
                              </div>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400">
                          No recent activity recorded
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
