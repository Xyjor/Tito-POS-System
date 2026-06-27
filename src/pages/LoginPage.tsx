import React, { useState } from "react";
import { login } from "../lib/tauri";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function LoginPage() {
  const { setUser } = useAuth();
  // Pre-filled credentials for the demo
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(username, password);
      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Shop POS Demo</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to try the interactive demo</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <p className="text-xs text-slate-500 text-center">Use <strong>demo</strong> / <strong>demo123</strong> to sign in.</p>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" disabled={loading} className="mt-2 w-full py-3">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
