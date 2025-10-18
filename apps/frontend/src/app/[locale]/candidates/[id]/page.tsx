"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMessages } from "next-intl";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";

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

  if (loading) return <div className="p-8">Loading candidate...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!candidate) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - profile */}
        <aside className="col-span-1 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {(candidate.firstName?.[0] || "") +
                (candidate.lastName?.[0] || "")}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {candidate.firstName} {candidate.lastName}
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {candidate.title || candidate.currentTitle || ""}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {candidate.location || candidate.address || ""}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {candidate.tags?.slice(0, 8).map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-zinc-800"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="pt-2">
            <div className="text-xs text-gray-500">Contact</div>
            <div className="mt-1 text-sm">
              <div>{candidate.email}</div>
              {candidate.phone && <div>{candidate.phone}</div>}
              {candidate.linkedin && (
                <div className="text-blue-600">
                  <a href={candidate.linkedin} target="_blank">
                    LinkedIn
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Skills</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {skillsList.slice(0, 12).map((s: string) => (
                <span
                  key={s}
                  className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-zinc-800"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Availability</div>
            <div className="mt-1 text-sm">
              {candidate.availability || "Not specified"}
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex gap-2">
              {candidate.resumeUrl && (
                <Button
                  onClick={async () => {
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
                  }}
                >
                  Download Resume
                </Button>
              )}
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(candidate.email || "");
                  alert("Email copied");
                }}
              >
                Copy Email
              </Button>
            </div>
          </div>
        </aside>

        {/* Right column - details and jobs */}
        <div className="col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button
                className={`px-3 py-1 rounded ${tab === "overview" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
                onClick={() => setTab("overview")}
              >
                Overview
              </button>
              <button
                className={`px-3 py-1 rounded ${tab === "jobs" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
                onClick={() => setTab("jobs")}
              >
                Jobs ({jobs.length})
              </button>
              <button
                className={`px-3 py-1 rounded ${tab === "activity" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
                onClick={() => setTab("activity")}
              >
                Activity
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Profile completeness:{" "}
              <span className="font-medium">
                {Math.min(
                  100,
                  Math.round((Object.keys(candidate || {}).length / 20) * 100)
                )}
                %
              </span>
            </div>
          </div>

          {tab === "overview" && (
            <section className="bg-white dark:bg-zinc-800 rounded-md p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">
                Professional summary
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {candidate.summary || "No summary provided."}
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Experience</h4>
                  <ul className="mt-2 space-y-2">
                    {(candidate.experience || []).map((e: any, i: number) => (
                      <li key={i} className="text-sm">
                        <div className="font-medium">
                          {e.title} @ {e.company}
                        </div>
                        <div className="text-xs text-gray-500">
                          {e.startDate} — {e.endDate || "Present"}
                        </div>
                        {e.description && (
                          <div className="text-xs mt-1 text-gray-700 dark:text-gray-300">
                            {e.description}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">Education & Certifications</h4>
                  <ul className="mt-2 space-y-2 text-sm">
                    {(candidate.education || []).map((ed: any, i: number) => (
                      <li key={i}>
                        <div className="font-medium">
                          {ed.institution} — {ed.degree}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ed.startDate} — {ed.endDate}
                        </div>
                      </li>
                    ))}
                    {(candidate.certifications || []).map(
                      (c: any, i: number) => (
                        <li key={`cert-${i}`} className="text-sm">
                          {c.name}{" "}
                          <span className="text-xs text-gray-500">
                            ({c.issuer})
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {tab === "jobs" && (
            <section className="space-y-4">
              {jobs.length === 0 ? (
                <div className="text-gray-500">No matched jobs available</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map((m: JobMatch, idx: number) => {
                    const jid = m.jobId || m.job?.id;
                    const app = (candidate.applications || []).find(
                      (a: any) => a.jobId === jid
                    );
                    const score = Math.round((m.score || 0) * 100) / 100;
                    const sim =
                      Math.round((m.embeddingSimilarity || 0) * 100) / 100;
                    const skills = (m.skillMatches?.matched || []).slice(0, 6);

                    return (
                      <article
                        key={m.id || idx}
                        className="border rounded-lg p-4 bg-white dark:bg-zinc-800 shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <a
                              href={`/${locale || ""}/jobs/${jid}`}
                              className="font-semibold text-lg truncate block"
                            >
                              {m.job?.title || "Untitled role"}
                            </a>
                            <div className="text-sm text-gray-500 mt-1">
                              {m.job?.company}
                              {m.job?.location ? ` • ${m.job.location}` : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm">
                              {score}
                            </div>
                            <div className="mt-2">
                              {app ? (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                  {app.status}
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                  Match
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                          {m.aiAnalysis?.summary ||
                            m.aiAnalysis?.recommendation ||
                            "No AI summary"}
                        </div>

                        {skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {skills.map((s: string) => (
                              <span
                                key={s}
                                className="text-xs bg-blue-50 dark:bg-zinc-700 px-2 py-1 rounded"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                          <div>
                            Similarity{" "}
                            <span className="font-medium text-gray-700">
                              {sim}
                            </span>
                          </div>
                          <a
                            href={`/${locale || ""}/jobs/${jid}`}
                            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                          >
                            View job
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {tab === "activity" && (
            <section className="bg-white dark:bg-zinc-800 rounded-md p-4 shadow-sm">
              <h3 className="font-semibold">Recent activity</h3>
              <ul className="mt-3 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                {(candidate.activity || [])
                  .slice(0, 10)
                  .map((a: any, i: number) => (
                    <li key={i}>
                      {a.text}{" "}
                      <span className="text-xs text-gray-500">{a.date}</span>
                    </li>
                  ))}
                {!(candidate.activity || []).length && (
                  <li className="text-gray-500">No recent activity</li>
                )}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
