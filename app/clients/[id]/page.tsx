"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

type ProposalRow = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const [clientName, setClientName] = useState<string>("...");
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [newProposalName, setNewProposalName] = useState("");
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

  async function loadClientAndProposals() {
    setMsg(null);
    setLoading(true);

    const session = await requireSession();
    if (!session) return;

    // Load client (only if you own it)
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .single();

    if (clientErr) {
      setMsg(clientErr.message);
      setLoading(false);
      return;
    }

    setClientName(client?.name ?? "Client");

    // Load proposals for this client
    const { data: props, error: propErr } = await supabase
      .from("proposals")
      .select("id,name,status,created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (propErr) setMsg(propErr.message);
    setProposals((props ?? []) as ProposalRow[]);
    setLoading(false);
  }

  async function createProposal() {
    setMsg(null);
    const name = newProposalName.trim();
    if (!name) return;

    const session = await requireSession();
    if (!session) return;

    const { error } = await supabase.from("proposals").insert({
      user_id: session.user.id,
      client_id: clientId,
      name,
      status: "draft",
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setNewProposalName("");
    await loadClientAndProposals();
  }

  useEffect(() => {
    loadClientAndProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <button onClick={() => router.push("/clients")} style={{ padding: 8 }}>
        ← Back to clients
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>
        {clientName}
      </h1>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <input
          placeholder="New proposal name (e.g., Website Redesign)"
          value={newProposalName}
          onChange={(e) => setNewProposalName(e.target.value)}
          style={{
            flex: 1,
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
        <button
          onClick={createProposal}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          Create draft
        </button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <div style={{ marginTop: 20 }}>
        {loading ? (
          <p>Loading…</p>
        ) : proposals.length === 0 ? (
          <p>No proposals yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {proposals.map((p) => (
              <li
                key={p.id}
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <button
  onClick={() => router.push(`/proposals/${p.id}`)}
  style={{
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontWeight: 650,
    textAlign: "left",
  }}
>
  {p.name}
</button>

                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {p.status} • {new Date(p.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
