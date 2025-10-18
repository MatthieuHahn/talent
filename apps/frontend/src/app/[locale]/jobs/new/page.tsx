"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CloudUpload,
  X,
  Briefcase,
} from "lucide-react";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

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
      const res = await fetch(`${BACKEND_URL}/jobs/upload-job-description`, {
        method: "POST",
        body: formData,
        headers,
      });
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

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setError("");
  };

  const removeFile = () => {
    setFile(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
              <Briefcase className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              {t("title") || "Create New Job"}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-lg mx-auto">
              {t("uploadSubtitle") ||
                "Upload a PDF job description to instantly create a new job posting. Our AI will extract all relevant details and requirements."}
            </p>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleUpload} className="space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t("uploadLabel") || "Job Description PDF"}
              </label>

              {!file ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer ${
                    dragActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 scale-105"
                      : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                  }`}
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
                    const droppedFile = e.dataTransfer.files?.[0];
                    if (droppedFile && droppedFile.type === "application/pdf") {
                      handleFileSelect(droppedFile);
                    } else {
                      setError("Please select a valid PDF file.");
                    }
                  }}
                  onClick={() =>
                    document.getElementById("job-description-input")?.click()
                  }
                >
                  <input
                    id="job-description-input"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      handleFileSelect(e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />

                  <div className="text-center">
                    <div
                      className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 ${
                        dragActive
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      <CloudUpload
                        className={`h-8 w-8 transition-colors duration-200 ${
                          dragActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      {dragActive
                        ? "Drop your job description here"
                        : "Choose a job description file"}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {t("dragDrop") ||
                        "Drag & drop your PDF file here, or click to browse"}
                    </p>

                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Supports PDF files up to 10MB
                    </div>
                  </div>
                </div>
              ) : (
                /* Selected File Display */
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                          {file.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • PDF
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-red-800 dark:text-red-300 text-sm">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-green-800 dark:text-green-300 text-sm">
                    {t("uploadSuccess") ||
                      "Job description uploaded successfully! Processing job details..."}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !file || success}
              className={`w-full inline-flex items-center justify-center gap-3 px-6 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform ${
                loading || !file || success
                  ? "bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl hover:-translate-y-0.5"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("uploading") || "Processing Job Description..."}
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  {t("uploadSuccess") || "Upload Complete!"}
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  {t("uploadButton") || "Upload & Create Job"}
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              <p className="mb-2">
                <strong>AI-Powered Processing:</strong> Our system will
                automatically extract:
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                  Job Requirements
                </span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                  Required Skills
                </span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                  Salary & Benefits
                </span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                  Candidate Matching
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
