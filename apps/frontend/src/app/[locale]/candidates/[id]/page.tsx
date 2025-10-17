"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useMessages } from "next-intl";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";

export default function CandidateDetailPage() {
  const t = useMessages();
  const locale = useLocale();
  const router = useRouter();
  const { id } = useParams();
  const { data: session } = useSession();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCandidate() {
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
          setError(t["candidate.notFound"] || "Candidate not found.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCandidate(data);
        setLoading(false);
      } catch (err) {
        setError(t["candidate.notFound"] || "Candidate not found.");
        setLoading(false);
      }
    }
    if (id && session) fetchCandidate();
  }, [id, t, session]);

  if (loading) return <div className="container mt-16">Loading...</div>;
  if (error) return <div className="container mt-16 text-red-600">{error}</div>;
  if (!candidate) return null;

  return (
    <div className="container mt-16">
      <h1 className="text-3xl font-bold mb-8 text-center dark:text-gray-100">
        {candidate.firstName} {candidate.lastName}
      </h1>
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-8 dark:bg-zinc-900 dark:text-gray-100">
        {/* Contact & Summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-lg dark:text-gray-100">
              {candidate.email}
            </span>
            {candidate.phone && (
              <span className="text-gray-500 dark:text-gray-400">
                {candidate.phone}
              </span>
            )}
          </div>
          {candidate.linkedin && (
            <div>
              <a
                href={`https://${candidate.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 underline"
              >
                <svg
                  width="18"
                  height="18"
                  fill="currentColor"
                  className="inline"
                >
                  <path d="M4 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 2a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm1 3h2v7H5V8zm7-1a3 3 0 0 1 3 3v5h-2v-5a1 1 0 0 0-2 0v5h-2V8h2v1a2 2 0 0 1 1-1zm-7 0h2v7H5V8z" />
                </svg>
                LinkedIn
              </a>
            </div>
          )}
          {candidate.github && (
            <div>
              <a
                href={candidate.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-800 underline"
              >
                <svg
                  width="18"
                  height="18"
                  fill="currentColor"
                  className="inline"
                >
                  <path d="M9 2C5.13 2 2 5.13 2 9c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 9c0-3.87-3.13-7-7-7z" />
                </svg>
                GitHub
              </a>
            </div>
          )}
          {candidate.resumeUrl && (
            <div>
              <Button
                variant="primary"
                className="inline-flex items-center gap-2 text-green-700 underline"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const headers: Record<string, string> = {};
                    if (session && (session.user as any)?.access_token) {
                      headers["Authorization"] =
                        `Bearer ${(session.user as any).access_token}`;
                    }
                    const res = await fetch(
                      `http://localhost:3001/candidates/${id}/resume-url`,
                      { headers }
                    );
                    if (!res.ok) throw new Error("Failed to get resume link");
                    const data = await res.json();
                    window.open(data.url, "_blank");
                  } catch (err) {
                    alert("Could not download resume");
                  }
                }}
              >
                <svg
                  width="18"
                  height="18"
                  fill="currentColor"
                  className="inline"
                >
                  <path d="M6 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8l-6-6zm6 14H6V4h5v5h5v7a1 1 0 0 1-1 1z" />
                </svg>
                Download Resume
              </Button>
            </div>
          )}
          {candidate.summary && (
            <div className="mt-4">
              <h2 className="font-semibold text-lg mb-2 dark:text-gray-100">
                Summary
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {candidate.summary}
              </p>
            </div>
          )}
          {candidate.status && (
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold dark:bg-blue-900 dark:text-blue-200">
                {candidate.status}
              </span>
            </div>
          )}
          {candidate.yearsOfExperience && (
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold dark:bg-gray-800 dark:text-gray-200">
                {candidate.yearsOfExperience} years experience
              </span>
            </div>
          )}
        </div>
        {/* Experience, Education, Skills */}
        <div className="space-y-6">
          {candidate.experience && candidate.experience.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-2 dark:text-gray-100">
                Experience
              </h2>
              <ul className="space-y-4">
                {candidate.experience.map((exp: any, idx: number) => (
                  <li key={idx} className="border-b pb-2">
                    <div className="font-semibold dark:text-gray-100">
                      {exp.title} @ {exp.company}
                    </div>
                    <div className="text-xs text-gray-500 mb-1 dark:text-gray-400">
                      {exp.startDate} - {exp.endDate}
                    </div>
                    <div className="mb-1 dark:text-gray-300">
                      {exp.description}
                    </div>
                    {exp.technologies && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exp.technologies.map((tech: string) => (
                          <span
                            key={tech}
                            className="bg-blue-100 rounded px-2 py-1 text-xs dark:bg-blue-900 dark:text-blue-200"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {candidate.education && candidate.education.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-2 dark:text-gray-100">
                Education
              </h2>
              <ul className="space-y-2">
                {candidate.education.map((edu: any, idx: number) => (
                  <li key={idx}>
                    <span className="font-semibold dark:text-gray-100">
                      {edu.degree}
                    </span>{" "}
                    -{" "}
                    <span className="dark:text-gray-300">
                      {edu.institution}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {candidate.skills &&
            candidate.skills.technical &&
            candidate.skills.technical.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg mb-2 dark:text-gray-100">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  {candidate.skills.technical.map((skill: string) => (
                    <span
                      key={skill}
                      className="bg-green-100 rounded px-2 py-1 text-xs dark:bg-green-900 dark:text-green-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          {candidate.tags && candidate.tags.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-2 dark:text-gray-100">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2 mt-1">
                {candidate.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-gray-200 rounded px-2 py-1 text-xs dark:bg-gray-700 dark:text-gray-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
