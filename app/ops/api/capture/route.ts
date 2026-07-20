import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/ops/audit";

const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

function siteOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return configured || req.nextUrl.origin;
}

// POST /ops/api/capture — founder starts a QR receipt-capture handoff. Returns
// the token, the phone URL, and a ready-to-render QR (SVG generated here so the
// qrcode lib never ships to the client).
export async function POST(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const token = randomBytes(32).toString("hex"); // 256-bit capability
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ops_capture_sessions").insert({
    token,
    created_by: guard.email,
    expires_at: expiresAt,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = `${siteOrigin(req)}/ops/capture/${token}`;
  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: 220,
    color: { dark: "#0A0A14", light: "#FFFFFF" },
  });

  await logAudit({
    actor_email: guard.email,
    action: "create",
    target_type: "capture_session",
    target_id: token,
  });

  return NextResponse.json({ token, url, qrSvg, expiresAt });
}
