"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMessages, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";

export default function SignupPage() {
  const t = useMessages();
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    organizationName: "",
    role: "RECRUITER",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || t["signup.error"]);
        setLoading(false);
        return;
      }
      // Automatically log in after signup
      const loginResult = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });
      if (loginResult?.error) {
        setError(loginResult.error || t["signup.error"]);
        setLoading(false);
        return;
      }
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setError(t["signup.error"]);
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
        {t["signup.title"] || "Sign Up"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-1 font-medium">
            {t["signup.firstName"] || "First Name"}
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={form.firstName}
            onChange={(e) =>
              setForm((f) => ({ ...f, firstName: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">
            {t["signup.lastName"] || "Last Name"}
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={form.lastName}
            onChange={(e) =>
              setForm((f) => ({ ...f, lastName: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">
            {t["signup.email"] || "Email"}
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
            {t["signup.password"] || "Password"}
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
        <div>
          <label className="block mb-1 font-medium">
            {t["signup.organizationName"] || "Organization Name"}
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={form.organizationName}
            onChange={(e) =>
              setForm((f) => ({ ...f, organizationName: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">
            {t["signup.role"] || "Role"}
          </label>
          <select
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="RECRUITER">Recruiter</option>
            <option value="ADMIN">Admin</option>
            <option value="HIRING_MANAGER">Hiring Manager</option>
            <option value="INTERVIEWER">Interviewer</option>
          </select>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full"
        >
          {loading
            ? t["signup.loading"] || "Signing up..."
            : t["signup.submit"] || "Sign Up"}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        <span>{t["signup.haveAccount"] || "Already have an account?"} </span>
        <a
          href={`/${locale}/login`}
          className="text-[var(--color-primary)] font-semibold hover:underline"
        >
          {t["signup.login"] || "Log in"}
        </a>
      </div>
    </div>
  );
}
