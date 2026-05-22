import { SLOTS, DAYS } from '@/lib/instructors';

export function MiniSlotPicker({ selectedIndex = 1 }: { selectedIndex?: number }) {
  const activeDay = 2;
  return (
    <div className="rounded-2xl bg-white border border-[#E8E8F2] p-4 min-w-0">
      <div className="flex gap-1.5 mb-3 overflow-x-auto -mx-1 px-1 min-w-0">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className="flex-shrink-0 rounded-lg px-3 py-2 text-center tabular-nums"
            style={{
              background: i === activeDay ? '#0A0A14' : 'white',
              color: i === activeDay ? 'white' : '#6B6B84',
              border: i === activeDay ? '1px solid #0A0A14' : '1px solid #E8E8F2',
              minWidth: 44,
            }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{d}</div>
            <div className="text-sm font-bold mt-0.5">{i + 12}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {SLOTS.map((s, i) => {
          const isSelected = i === selectedIndex;
          const isTaken = !s.avail;
          return (
            <div
              key={s.time}
              className="flex items-center justify-between rounded-lg border px-3 py-2.5 tabular-nums"
              style={{
                background: isSelected ? '#2D6A4F' : 'white',
                color: isSelected ? 'white' : isTaken ? '#9B9BB5' : '#0A0A14',
                borderColor: isSelected ? '#2D6A4F' : '#E8E8F2',
                opacity: isTaken ? 0.5 : 1,
              }}
            >
              <span className="text-sm font-semibold">{s.time}</span>
              <div className="flex items-center gap-2">
                {s.tag && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                    style={{
                      background: isSelected
                        ? 'rgba(255,255,255,0.2)'
                        : isTaken
                        ? '#F0EDF0'
                        : s.tag === 'Early'
                        ? 'rgba(255,176,32,0.15)'
                        : 'rgba(232,82,122,0.12)',
                      color: isSelected
                        ? 'white'
                        : isTaken
                        ? '#9B9BB5'
                        : s.tag === 'Early'
                        ? '#B07000'
                        : '#E8527A',
                    }}
                  >
                    {isSelected ? 'Selected' : s.tag}
                  </span>
                )}
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
