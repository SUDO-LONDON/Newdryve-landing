import { NextResponse } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { logAudit } from "@/lib/ops/audit";
import {
  approveInstructor,
  InstructorApiError,
  reinstateInstructor,
  rejectInstructor,
} from "@/lib/ops/instructors";

// Approve / reject / reinstate an instructor application.
//
// The decision is made here, inside the authenticated portal — never from a
// link in an email. requireFounder() re-verifies the session server-side even
// though middleware already gated /ops, and the live API independently
// re-checks the acting founder against its own allowlist.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "approve" | "reject" | "reinstate";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid instructor id" }, { status: 400 });
  }

  let body: { action?: Action; reason?: string; adi_verified?: boolean; dbs_verified?: boolean; is_listed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "approve" && action !== "reject" && action !== "reinstate") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    if (action === "approve") {
      await approveInstructor(guard.email, id, {
        adi_verified: body.adi_verified === true,
        dbs_verified: body.dbs_verified === true,
        is_listed: body.is_listed === true,
      });
    } else if (action === "reject") {
      const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
      await rejectInstructor(guard.email, id, reason || null);
    } else {
      await reinstateInstructor(guard.email, id);
    }
  } catch (err) {
    if (err instanceof InstructorApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[ops/instructors] action failed", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  // Approving or rejecting a named individual is a decision worth a permanent
  // record on this side too, independent of the API's own audit columns.
  await logAudit({
    actor_email: guard.email,
    action: `instructor_${action}`,
    target_type: "instructor",
    target_id: id,
    detail:
      action === "approve"
        ? {
            adi_verified: body.adi_verified === true,
            dbs_verified: body.dbs_verified === true,
            is_listed: body.is_listed === true,
          }
        : action === "reject"
          ? { reason: body.reason ?? null }
          : undefined,
  }).catch((err) => {
    // The decision already landed upstream; a failed audit write must not
    // report the action as failed.
    console.error("[ops/instructors] audit write failed", err);
  });

  return NextResponse.json({ ok: true });
}
