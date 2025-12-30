"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

type Answers = {
  businessName?: string;
  clientIndustry?: string;
  projectGoal?: string;
  services?: string[];
  timeline?: string;
};

const STEPS = [
  { key: "businessName", label: "Your business name", type: "text" as const },
  { key: "clientIndustry", label: "Client industry", type: "text" as const },
  { key: "projectGoal", label: "Primary goal", type: "textarea" as const },
  { key: "services", label: "Services to include", type: "multiselect" as const },
  { key: "timeline", label: "Timeline", type: "text" as const },
];

const SERVICE_OPTIONS = [
  "Discovery / strategy",
  "Copywriting",
  "Design",
  "Development",
  "SEO",
  "Analytics / tracking",
  "Maintenance",
];

export default function ProposalBuilderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const proposalId = params.id;

  const [proposalName, setProposalName] = useState<string>("Proposal");
  const [clientId, setClientId] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const currentStep = useMemo(() => STEPS[stepIndex], [stepIndex]);

  async function requireSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      router.push("/login");
      return null;
    }
    return data.session;
  }

  async function loadProposalAndAnswers() {
    setMsg(null);
    setLoading(true);

    const session = await requireSession();
    if (!session) return;

    // Load proposal (ownership is enforced by RLS)
    const { data: proposal, error: propErr } = await supabase
      .from("proposals")
      .select("name, client_id")
      .eq("id", proposalId)
      .single();

    if (propErr) {
      setMsg(propErr.message);
      setLoading(false);
      return;
    }

    setProposalName(proposal?.name ?? "Proposal");
    setClientId(proposal?.client_id ?? null);

    // Load answers (may not exist yet)
    const { data: ansRow, error: ansErr } = await supabase
      .from("proposal_answers")
      .select("answers")
      .eq("proposal_id", proposalId)
      .maybeSingle();

    if (ansErr) {
      setMsg(ansErr.message);
    } else {
      setAnswers((ansRow?.answers ?? {}) as Answers);
    }

    setLoading(false);
  }

  // Debounced autosave (saves 600ms after last change)
  useEffect(() => {
    if (loading) return;

    const t = setTimeout(async () => {
      setSaving(true);
      setMsg(null);

      try {
        const session = await requireSession();
        if (!session) return;

        const { error } = await supabase
          .from("proposal_answers")
          .upsert({ proposal_id: proposalId, answers }, { onConflict: "proposal_id" });

        if (error) throw error;
      } catch (e: any) {
        setMsg(e?.message ?? "Autosave failed");
      } finally {
        setSaving(false);
      }
    }, 600);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, proposalId, loading]);

  useEffect(() => {
    loadProposalAndAnswers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  function setField<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleService(option: string) {
    const current = answers.services ?? [];
    if (current.includes(option)) {
      setField(
        "services",
        current.filter((x) => x !== option)
      );
    } else {
      setField("services", [...current, option]);
    }
  }

  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <button
        onClick={() => clientId ? router.push(`/clients/${clientId}`) : router.push("/clients")}
        style={{ padding: 8 }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>
        {proposalName}
      </h1>

      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 8, background: "#eee", borderRadius: 999 }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "#111", borderRadius: 999 }} />
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{progress}%</div>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        {saving ? "Saving…" : "Saved"} {msg ? ` • ${msg}` : ""}
      </div>

      {loading ? (
        <p style={{ marginTop: 20 }}>Loading…</p>
      ) : (
        <div style={{ marginTop: 22, border: "1px solid #e5e5e5", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            Step {stepIndex + 1} of {STEPS.length}
          </div>
          <h2 style={{ marginTop: 8, fontSize: 18 }}>{currentStep.label}</h2>

          <div style={{ marginTop: 12 }}>
            {currentStep.type === "text" && (
              <input
                value={(answers as any)[currentStep.key] ?? ""}
                onChange={(e) => setField(currentStep.key as any, e.target.value)}
                style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
              />
            )}

            {currentStep.type === "textarea" && (
              <textarea
                value={(answers as any)[currentStep.key] ?? ""}
                onChange={(e) => setField(currentStep.key as any, e.target.value)}
                rows={5}
                style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
              />
            )}

            {currentStep.type === "multiselect" && (
              <div style={{ display: "grid", gap: 8 }}>
                {SERVICE_OPTIONS.map((opt) => {
                  const checked = (answers.services ?? []).includes(opt);
                  return (
                    <label key={opt} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              style={{ padding: "10px 14px", borderRadius: 6 }}
            >
              Back
            </button>

            <button
              onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
              disabled={stepIndex === STEPS.length - 1}
              style={{
                padding: "10px 14px",
                borderRadius: 6,
                border: "1px solid #111",
                background: "#111",
                color: "white",
                cursor: "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
