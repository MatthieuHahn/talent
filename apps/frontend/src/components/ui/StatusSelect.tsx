"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  value?: string;
  onChange: (newStatus: string) => Promise<void> | void;
  className?: string;
  disabled?: boolean;
}

const STATUSES = [
  "APPLIED",
  "REVIEWING",
  "PHONE_SCREEN",
  "INTERVIEW",
  "TECHNICAL_TEST",
  "FINAL_INTERVIEW",
  "REFERENCE_CHECK",
  "OFFER_MADE",
  "OFFER_ACCEPTED",
  "OFFER_REJECTED",
  "REJECTED",
  "WITHDRAWN",
];

function pretty(s: string) {
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^| )\w/g, (c) => c.toUpperCase());
}

function getStatusColor(status: string) {
  switch (status) {
    case "APPLIED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "REVIEWING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "PHONE_SCREEN":
    case "INTERVIEW":
    case "TECHNICAL_TEST":
    case "FINAL_INTERVIEW":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "REFERENCE_CHECK":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    case "OFFER_MADE":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "OFFER_ACCEPTED":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "OFFER_REJECTED":
    case "REJECTED":
    case "WITHDRAWN":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
}

export default function StatusSelect({
  value,
  onChange,
  className,
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<string | undefined>(value);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setLocal(newStatus);
    try {
      const maybePromise = onChange(newStatus);
      if (maybePromise && typeof (maybePromise as any).then === "function") {
        setLoading(true);
        await maybePromise;
      }
    } catch (err) {
      // revert to previous
      setLocal(value);
      console.error(err);
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <select
        value={local || "APPLIED"}
        onChange={handleChange}
        disabled={disabled || loading}
        className={`px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-10 ${className || ""}`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {pretty(s)}
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <svg
            className="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>

      {/* Status indicator badge */}
      {local && (
        <div
          className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-semibold shadow-sm border border-white dark:border-slate-800 ${getStatusColor(local)}`}
        >
          {pretty(local).split(" ")[0]}
        </div>
      )}
    </div>
  );
}
