import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/ops/audit";
import {
  RECEIPT_MAX_SIZE,
  isAllowedReceipt,
  receiptExtensionOf,
  safeReceiptName,
} from "@/lib/ops/receipts";
import type { OpsCaptureSession } from "@/lib/ops/types";

// POST /ops/api/expenses  (multipart/form-data: description, amount, spent_on?,
// category?, and EITHER a `receipt` file OR a `capture_token` from a completed
// QR phone-capture session). A receipt is mandatory either way.
export async function POST(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "invalid form data" }, { status: 400 });

  const description = String(form.get("description") ?? "").trim();
  const category = String(form.get("category") ?? "").trim() || null;
  const amountRaw = Number(form.get("amount"));
  const spentOnRaw = String(form.get("spent_on") ?? "").trim();
  const file = form.get("receipt");
  const captureToken = String(form.get("capture_token") ?? "").trim();

  if (!description) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }
  if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
    return NextResponse.json({ error: "amount must be greater than 0" }, { status: 400 });
  }

  const amountPence = Math.round(amountRaw * 100);
  const spentOn = /^\d{4}-\d{2}-\d{2}$/.test(spentOnRaw)
    ? spentOnRaw
    : new Date().toISOString().slice(0, 10);

  const expenseId = randomUUID();
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  let receiptPath: string;
  let receiptMime: string | null;
  let uploadedObjectPath: string | null = null; // for rollback of a fresh upload

  if (file instanceof File && file.size > 0) {
    // Direct file upload (desktop file picker).
    if (file.size > RECEIPT_MAX_SIZE) {
      return NextResponse.json({ error: "receipt exceeds the 25MB limit" }, { status: 400 });
    }
    if (!isAllowedReceipt(file.name)) {
      const ext = receiptExtensionOf(file.name);
      return NextResponse.json({ error: `unsupported receipt type .${ext || "?"}` }, { status: 400 });
    }
    const storagePath = `${expenseId}/${randomUUID()}__${safeReceiptName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadErr } = await admin.storage
      .from("receipts")
      .upload(storagePath, buffer, { contentType: file.type || undefined, upsert: false });
    if (uploadErr) {
      return NextResponse.json({ error: `receipt upload failed: ${uploadErr.message}` }, { status: 500 });
    }
    receiptPath = storagePath;
    receiptMime = file.type || null;
    uploadedObjectPath = storagePath;
  } else if (captureToken) {
    // Receipt captured on a phone via the QR handoff.
    const { data: sessionRow, error: sErr } = await supabase
      .from("ops_capture_sessions")
      .select("*")
      .eq("token", captureToken)
      .maybeSingle();
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
    const session = sessionRow as unknown as OpsCaptureSession | null;
    if (!session || !session.receipt_path) {
      return NextResponse.json({ error: "capture session has no receipt" }, { status: 400 });
    }
    if (session.status === "used") {
      return NextResponse.json({ error: "capture already used" }, { status: 409 });
    }
    if (new Date(session.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "capture session expired" }, { status: 410 });
    }
    if (session.created_by.toLowerCase() !== guard.email.toLowerCase()) {
      return NextResponse.json({ error: "capture session belongs to another user" }, { status: 403 });
    }

    // Re-home the object under the expense id; fall back to the captures path.
    const basename = session.receipt_path.split("/").pop() ?? "receipt";
    const targetPath = `${expenseId}/${basename}`;
    const { error: moveErr } = await admin.storage
      .from("receipts")
      .move(session.receipt_path, targetPath);
    receiptPath = moveErr ? session.receipt_path : targetPath;
    receiptMime = session.receipt_mime;

    await supabase
      .from("ops_capture_sessions")
      .update({ status: "used", used_at: new Date().toISOString() })
      .eq("token", captureToken);
  } else {
    return NextResponse.json({ error: "a receipt is required" }, { status: 400 });
  }

  try {
    const { data: expense, error: insErr } = await supabase
      .from("ops_expenses")
      .insert({
        id: expenseId,
        description,
        category,
        amount_pence: amountPence,
        spent_on: spentOn,
        receipt_path: receiptPath,
        receipt_mime: receiptMime,
        created_by: guard.email,
      })
      .select("*")
      .single();
    if (insErr) throw insErr;

    await logAudit({
      actor_email: guard.email,
      action: "create",
      target_type: "expense",
      target_id: expenseId,
      detail: { amount_pence: amountPence, description, category, via: captureToken ? "phone_capture" : "upload" },
    });

    return NextResponse.json({ expense });
  } catch (e) {
    // Roll back a fresh upload; a re-homed capture object is left in place.
    if (uploadedObjectPath) {
      await admin.storage.from("receipts").remove([uploadedObjectPath]).catch(() => {});
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
