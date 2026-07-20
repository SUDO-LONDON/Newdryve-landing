import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  RECEIPT_MAX_SIZE,
  isAllowedReceipt,
  receiptExtensionOf,
  safeReceiptName,
} from "@/lib/ops/receipts";
import type { OpsCaptureSession } from "@/lib/ops/types";

type Ctx = { params: Promise<{ token: string }> };

// These endpoints are reached by an unauthenticated phone, so the token itself
// is the capability. We validate it server-side and use the service-role client
// (which bypasses RLS) — never an arbitrary caller-supplied path or identity.

function effectiveStatus(s: OpsCaptureSession): OpsCaptureSession["status"] {
  if (s.status === "pending" && new Date(s.expires_at).getTime() < Date.now()) return "expired";
  return s.status;
}

// GET /ops/api/capture/[token] — status poll (phone + desktop). Reveals only
// the status, nothing sensitive.
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ops_capture_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ status: effectiveStatus(data as unknown as OpsCaptureSession) });
}

// POST /ops/api/capture/[token] — phone uploads the receipt photo.
export async function POST(req: NextRequest, { params }: Ctx) {
  const { token } = await params;

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "invalid form data" }, { status: 400 });

  const file = form.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "a receipt photo is required" }, { status: 400 });
  }
  if (file.size > RECEIPT_MAX_SIZE) {
    return NextResponse.json({ error: "receipt exceeds the 25MB limit" }, { status: 400 });
  }
  const ext = receiptExtensionOf(file.name);
  if (!isAllowedReceipt(file.name)) {
    return NextResponse.json({ error: `unsupported receipt type .${ext || "?"}` }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: sessionRow, error: findErr } = await admin
    .from("ops_capture_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!sessionRow) return NextResponse.json({ error: "not found" }, { status: 404 });

  const session = sessionRow as unknown as OpsCaptureSession;
  if (session.status === "used") {
    return NextResponse.json({ error: "this link has already been used" }, { status: 409 });
  }
  if (new Date(session.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "this link has expired" }, { status: 410 });
  }

  // Re-take: drop the previous object so we don't leave orphans in the bucket.
  if (session.receipt_path) {
    await admin.storage.from("receipts").remove([session.receipt_path]).catch(() => {});
  }

  const storagePath = `captures/${token}/${randomUUID()}__${safeReceiptName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await admin.storage
    .from("receipts")
    .upload(storagePath, buffer, { contentType: file.type || undefined, upsert: false });
  if (uploadErr) {
    return NextResponse.json({ error: `upload failed: ${uploadErr.message}` }, { status: 500 });
  }

  // The admin (supabase-js) client is schema-untyped, so its update payload
  // resolves to `never`; cast this known-good patch through.
  const patch = {
    status: "received",
    receipt_path: storagePath,
    receipt_mime: file.type || null,
  } as never;
  const { error: updErr } = await admin
    .from("ops_capture_sessions")
    .update(patch)
    .eq("token", token);
  if (updErr) {
    await admin.storage.from("receipts").remove([storagePath]).catch(() => {});
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
