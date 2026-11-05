import { useState, type FormEvent } from "react";
import api from "../../lib/axios";

interface LoginResponse {
  accessToken: string;
  user: { id: string; name: string; role: string };
}

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
      localStorage.setItem("fleetdash.accessToken", data.accessToken);
      onLogin();
    } catch {
      setError("Unable to sign in. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to FleetDash</h1>
          <p className="mt-1 text-sm text-slate-500">Use your fleet account to continue.</p>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
};

export default LoginPage;
