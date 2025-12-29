"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created. You can log in now.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/clients");
      }
    } catch (err: any) {
      setMessage(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>
        {isSignUp ? "Create account" : "Log in"}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <input
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
        />

        <button
          disabled={loading}
          type="submit"
          style={{
            padding: 10,
            borderRadius: 6,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          {loading ? "Working…" : isSignUp ? "Sign up" : "Log in"}
        </button>

        <button
          type="button"
          onClick={() => setIsSignUp((s) => !s)}
          style={{
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "white",
            cursor: "pointer",
          }}
        >
          {isSignUp ? "I already have an account" : "Create an account"}
        </button>

        {message && <p style={{ marginTop: 8 }}>{message}</p>}
      </form>
    </div>
  );
}
