"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type ClientRow = {
  id: string;
  name: string;
  created_at: string;
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function requireSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      router.push("/login");
      return null;
    }
    return data.session;
  }

  async function loadClients() {
    setMsg(null);
    setLoading(true);

    const session = await requireSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("clients")
      .select("id,name,created_at")
      .eq("user_id", session.user.id)
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (error) setMsg(error.message);
    setClients((data ?? []) as ClientRow[]);
    setLoading(false);
  }

  async function addClient() {
    setMsg(null);
    const name = newName.trim();
    if (!name) return;

    const session = await requireSession();
    if (!session) return;

    const { error } = await supabase.from("clients").insert({
      user_id: session.user.id,
      name,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setNewName("");
    await loadClients();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Clients</h1>
        <button onClick={logout} style={{ padding: 8 }}>
          Log out
        </button>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <input
          placeholder="New client name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{
            flex: 1,
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
        <button
          onClick={addClient}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          Add client
        </button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <div style={{ marginTop: 20 }}>
        {loading ? (
          <p>Loading…</p>
        ) : clients.length === 0 ? (
          <p>No clients yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {clients.map((c) => (
              <li
                key={c.id}
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <button
  onClick={() => router.push(`/clients/${c.id}`)}
  style={{
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontWeight: 650,
    textAlign: "left",
  }}
>
  {c.name}
</button>

                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  Created {new Date(c.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
