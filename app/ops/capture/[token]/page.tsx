import MobileReceiptCapture from "@/components/ops/MobileReceiptCapture";

// Public, token-gated mobile page opened by scanning the QR on the laptop.
// Middleware exempts /ops/capture from the founder gate; the token is the
// capability and every action is validated server-side.
export const dynamic = "force-dynamic";

export default async function CapturePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-racing-green">Newdryve</p>
        <h1 className="font-display text-2xl text-ink">Add a receipt</h1>
      </div>
      <MobileReceiptCapture token={token} />
    </div>
  );
}
