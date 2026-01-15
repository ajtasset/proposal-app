import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing SUPABASE env vars" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 1) Find proposal by share_token
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("id, name, status, created_at, updated_at, share_token")
    .eq("share_token", token)
    .maybeSingle();

  if (proposalError) return NextResponse.json({ error: proposalError.message }, { status: 500 });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 2) Fetch answers by proposal_id
  const { data: pa, error: answersError } = await supabase
    .from("proposal_answers")
    .select("answers")
    .eq("proposal_id", proposal.id)
    .maybeSingle();

  if (answersError) return NextResponse.json({ error: answersError.message }, { status: 500 });

  // 3) Return combined payload
  return NextResponse.json({
    proposal: {
      ...proposal,
      answers: pa?.answers ?? null,
    },
  });
}
