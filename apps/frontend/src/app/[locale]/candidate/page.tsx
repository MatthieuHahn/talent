"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useMessages } from "next-intl";
import Button from "@/components/ui/Button";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export default function CandidatePage() {
  const t = useMessages();
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Only track upload state
  const [candidate, setCandidate] = useState<any>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError(t["candidate.uploadError"] || "Please select a resume file.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      // Add any additional fields if needed
      const headers: Record<string, string> = {};
      // Use the correct JWT property from session object
      if (session && (session.user as any)?.access_token) {
        headers["Authorization"] =
          `Bearer ${(session.user as any).access_token}`;
      }
      const res = await fetch(`${BACKEND_URL}/candidates/upload-resume`, {
        method: "POST",
        body: formData,
        headers,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || t["candidate.uploadError"]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLoading(false);
      router.push(`/${locale}/candidates/${data.id}`);
    } catch (err) {
      setError(t["candidate.uploadError"]);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {t["candidate.title"] || "Upload Candidate Resume"}
      </h1>
      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label htmlFor="resume" className="block font-medium mb-2">
            {t["candidate.uploadLabel"] || "Resume PDF"}
          </label>
          <input
            id="resume"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full border rounded px-3 py-2"
            required
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Button type="submit" disabled={loading || !file}>
          {loading
            ? t["candidate.uploading"] || "Uploading..."
            : t["candidate.uploadButton"] || "Upload"}
        </Button>
      </form>
    </div>
  );
}
