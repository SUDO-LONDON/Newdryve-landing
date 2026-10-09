"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="focus-ring inline-flex min-h-11 items-center rounded-full bg-racing-green px-5 text-sm font-bold text-white"
    >
      Print or save as PDF
    </button>
  );
}
