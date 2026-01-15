// app/share/[token]/page.tsx
import { headers } from "next/headers";

export default async function SharePage(
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const h = await headers();
  const host = h.get("host");

  // Use host-based URL so it works on localhost AND Vercel
  const proto = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/share/${token}`, { cache: "no-store" });

  if (res.status === 404) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Not found</h2>
        <p>This share link is invalid or has been revoked.</p>
      </div>
    );
  }

  const json = await res.json();

  if (!res.ok) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Error</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(json, null, 2)}
        </pre>
      </div>
    );
  }

  const proposal = json.proposal;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>{proposal?.name ?? "Shared Proposal"}</h1>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        Status: {proposal?.status ?? "—"} • Created:{" "}
        {proposal?.created_at ? new Date(proposal.created_at).toLocaleString() : "—"}
      </div>

      <h3 style={{ marginTop: 24 }}>Answers</h3>
      <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(proposal?.answers ?? null, null, 2)}
      </pre>
    </div>
  );
}
