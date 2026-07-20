import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/ops/audit";

// A receipt photo is REQUIRED on every spend. Images plus PDF are accepted.
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "heic", "heif", "pdf"];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i + 1).toLowerCase();
}

function safeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(-180) || "receipt";
}

// POST /ops/api/expenses  (multipart/form-data: description, amount, receipt,
// category?, spent_on?) — records a spend with its required receipt object.
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

  if (!description) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }
  if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
    return NextResponse.json({ error: "amount must be greater than 0" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "a receipt photo is required" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "receipt exceeds the 25MB limit" }, { status: 400 });
  }
  const ext = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `unsupported receipt type .${ext || "?"}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const amountPence = Math.round(amountRaw * 100);
  const spentOn = /^\d{4}-\d{2}-\d{2}$/.test(spentOnRaw)
    ? spentOnRaw
    : new Date().toISOString().slice(0, 10);

  const expenseId = randomUUID();
  const storagePath = `${expenseId}/${randomUUID()}__${safeFilename(file.name)}`;

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await admin.storage
    .from("receipts")
    .upload(storagePath, buffer, { contentType: file.type || undefined, upsert: false });
  if (uploadErr) {
    return NextResponse.json({ error: `receipt upload failed: ${uploadErr.message}` }, { status: 500 });
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
        receipt_path: storagePath,
        receipt_mime: file.type || null,
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
      detail: { amount_pence: amountPence, description, category },
    });

    return NextResponse.json({ expense });
  } catch (e) {
    // Don't leak an orphaned receipt object if the row insert fails.
    await admin.storage.from("receipts").remove([storagePath]).catch(() => {});
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
