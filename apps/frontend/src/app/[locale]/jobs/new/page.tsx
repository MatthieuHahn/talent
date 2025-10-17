"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/Button";

export default function NewJobPage() {
  const t = useTranslations("jobs.job");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError(t("uploadError"));
      return;
    }
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("jobDescription", file);
      const headers: Record<string, string> = {};
      if (session && (session.user as any)?.access_token) {
        headers["Authorization"] =
          `Bearer ${(session.user as any).access_token}`;
      }
      const res = await fetch(
        "http://localhost:3001/jobs/upload-job-description",
        {
          method: "POST",
          body: formData,
          headers,
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || t("uploadError"));
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/jobs/${data.id}`);
      }, 1200);
    } catch (err) {
      setError(t("uploadError"));
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-16 p-0 sm:p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-800">
      <div className="flex flex-col items-center gap-2 pt-8">
        <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-4 mb-2">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
            <rect width="24" height="24" rx="12" fill="#2563eb" />
            <path
              d="M8 16V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 12v4"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 16h0"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center dark:text-gray-100">
          {t("title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-4 max-w-md">
          {t("uploadSubtitle") ||
            "Upload a PDF job description to instantly create a new job. Our AI will extract all relevant details and skills."}
        </p>
      </div>
      <form
        onSubmit={handleUpload}
        className="space-y-6 px-4 sm:px-0"
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
        }}
      >
        <div>
          <label htmlFor="jobDescription" className="block font-medium mb-2">
            {t("uploadLabel")}
          </label>
          <div
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-6 py-8 transition ${dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800"}`}
          >
            <input
              id="jobDescription"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              required
            />
            <div className="flex flex-col items-center pointer-events-none">
              <svg
                width="32"
                height="32"
                fill="none"
                viewBox="0 0 24 24"
                className="mb-2 text-blue-600 dark:text-blue-400"
              >
                <path
                  d="M12 16v-8m0 0l-4 4m4-4l4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {file
                  ? file.name
                  : t("dragDrop") ||
                    "Drag & drop or click to select a PDF file"}
              </span>
            </div>
          </div>
        </div>
        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}
        {success && (
          <div className="text-green-600 text-sm text-center">
            {t("uploadSuccess") || "Job uploaded! Redirecting..."}
          </div>
        )}
        <Button type="submit" disabled={loading || !file} className="w-full">
          {loading ? t("uploading") : t("uploadButton")}
        </Button>
      </form>
      <div className="py-4" />
    </div>
  );
}
