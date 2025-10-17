"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status?: string;
  yearsOfExperience?: number;
  tags?: string[];
};

type CandidateResponse = {
  candidates: Candidate[];
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
        const res = await fetch("http://localhost:3001/candidates", {
          headers,
        });
        if (!res.ok) {
          setError(t("listError"));
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCandidates(data);
        setLoading(false);
      } catch (err) {
        setError(t("listError"));
        setLoading(false);
      }
    }
    if (session) fetchCandidates();
  }, [t, session]);

  if (status === "loading" || !session)
    return <div className="container mt-16">Loading...</div>;
  if (error) return <div className="container mt-16 text-red-600">{error}</div>;

  return (
    <div className="container mt-16">
      <h1 className="text-3xl font-bold mb-8 text-center dark:text-gray-100">
        {t("title")}
      </h1>
      <div className="flex justify-end mb-6">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition"
          onClick={() => router.push(`/${locale}/candidates/new`)}
        >
          + Add Candidate
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {candidates.candidates.map((candidate: Candidate) => (
          <div
            key={candidate.id}
            className="card p-6 cursor-pointer hover:shadow-xl transition dark:bg-zinc-900 dark:text-gray-100"
            onClick={() => router.push(`/${locale}/candidates/${candidate.id}`)}
          >
            <div className="font-bold text-xl mb-2 dark:text-gray-100">
              {candidate.firstName} {candidate.lastName}
            </div>
            <div className="text-gray-600 dark:text-gray-300 mb-1">
              {candidate.email}
            </div>
            {candidate.status && (
              <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold dark:bg-blue-900 dark:text-blue-200">
                {candidate.status}
              </span>
            )}
            {candidate.yearsOfExperience && (
              <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold dark:bg-gray-800 dark:text-gray-200 ml-2">
                {candidate.yearsOfExperience} yrs
              </span>
            )}
            {candidate.tags && candidate.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {candidate.tags.slice(0, 6).map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-gray-200 rounded px-2 py-1 text-xs dark:bg-gray-700 dark:text-gray-100"
                  >
                    {tag}
                  </span>
                ))}
                {candidate.tags.length > 6 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{candidate.tags.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
