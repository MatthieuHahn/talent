"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMessages, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const t = useMessages();
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });
      if (result?.error) {
        setError(result.error || t["login.error"]);
        setLoading(false);
        return;
      }
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setError(t["login.error"]);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg">
      <div className="mb-6">
        {status === "loading" && <div>Loading session...</div>}
        {status === "authenticated" && session?.user && (
          <div className="text-right text-sm text-gray-600">
            Logged in as:{" "}
            <span className="font-semibold">{session.user.email}</span>
          </div>
        )}
        {status === "unauthenticated" && (
          <div className="text-right text-sm text-red-500">Not logged in</div>
        )}
      </div>
      <h1 className="text-2xl font-bold mb-6 text-center">
        {t["login.title"] || "Log In"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-1 font-medium">
            {t["login.email"] || "Email"}
          </label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">
            {t["login.password"] || "Password"}
          </label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full"
        >
          {loading
            ? t["login.loading"] || "Logging in..."
            : t["login.submit"] || "Log In"}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        <span>{t["login.noAccount"] || "Don't have an account?"} </span>
        <a
          href={`/${locale}/signup`}
          className="text-[var(--color-primary)] font-semibold hover:underline"
        >
          {t["login.signup"] || "Sign up"}
        </a>
      </div>
    </div>
  );
}
