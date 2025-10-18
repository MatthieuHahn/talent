"use client";
import { useState } from "react";

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
    <select
      value={local || "APPLIED"}
      onChange={handleChange}
      disabled={disabled || loading}
      className={
        "px-3 py-1 rounded border text-sm bg-white dark:bg-zinc-900 dark:text-gray-100 " +
        (className || "")
      }
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {pretty(s)}
        </option>
      ))}
    </select>
  );
}
