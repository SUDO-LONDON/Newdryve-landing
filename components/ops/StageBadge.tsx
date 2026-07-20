// Deterministic pastel stage badge. Colour is derived from the stage string so
// the same stage always renders consistently without hardcoding per-board maps.
const PALETTE = [
  "bg-blush-surface text-ink border-blush-border",
  "bg-[#E7F0EC] text-racing-green border-[#CFE3D8]",
  "bg-[#FDECF1] text-deep-rose border-[#F7D3DF]",
  "bg-[#EEEBF5] text-ink border-[#DED9EC]",
  "bg-[#F0EEE6] text-ink border-[#E2DECD]",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function StageBadge({ stage }: { stage: string | null | undefined }) {
  if (!stage) return <span className="text-ink-muted text-xs">—</span>;
  const cls = PALETTE[hash(stage) % PALETTE.length];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {stage}
    </span>
  );
}
