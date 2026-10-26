import type { ChartWeek } from "@/lib/scoreboard/chart";
import { formatDay } from "@/lib/week/dates";

// Fixed series colors: the first member (you) is always blue and the second
// orange, so a color never swaps meaning between visits.
const SERIES = [
  "fill-[#2a78d6] dark:fill-[#3987e5]",
  "fill-[#eb6834] dark:fill-[#d95926]",
];
const W = 320;
const H = 120; // plot height; labels sit below it
const BAR_GAP = 2;

// A small grouped bar chart of each week's test score (as a percentage) for
// every member. Hovering or long-pressing a bar shows its exact score. The
// table below it carries the same numbers for screen readers.
export function ScoreChart({
  weeks,
  members,
}: {
  weeks: ChartWeek[];
  members: { id: string; label: string }[];
}) {
  const groupW = W / weeks.length;
  const barW = Math.min(18, (groupW * 0.6) / members.length);
  return (
    <figure className="flex w-full flex-col gap-2">
      <figcaption className="flex justify-center gap-4 text-xs text-muted-foreground">
        {members.map((m, i) => (
          <span key={m.id} className="flex items-center gap-1.5">
            <svg width="10" height="10" aria-hidden="true">
              <rect width="10" height="10" rx="2" className={SERIES[i]} />
            </svg>
            {m.label}
          </span>
        ))}
      </figcaption>
      <svg
        viewBox={`0 -10 ${W} ${H + 28}`}
        className="w-full"
        role="img"
        aria-label="Weekly test scores as a percentage"
      >
        {[50, 100].map((p) => (
          <g key={p}>
            <line
              x1="0"
              x2={W}
              y1={H - (p / 100) * H}
              y2={H - (p / 100) * H}
              className="stroke-border"
              strokeDasharray="2 3"
            />
            <text
              x={W}
              y={H - (p / 100) * H - 3}
              textAnchor="end"
              className="fill-muted-foreground text-[8px]"
            >
              {p}%
            </text>
          </g>
        ))}
        <line x1="0" x2={W} y1={H} y2={H} className="stroke-border" />
        {weeks.map((week, g) => {
          const groupX =
            g * groupW + (groupW - members.length * (barW + BAR_GAP)) / 2;
          return (
            <g key={week.id}>
              {week.percents.map((p, i) => {
                if (p === null) return null;
                const h = Math.max(2, (p / 100) * H);
                return (
                  <rect
                    key={i}
                    x={groupX + i * (barW + BAR_GAP)}
                    y={H - h}
                    width={barW}
                    height={h}
                    rx="2"
                    className={SERIES[i]}
                  >
                    <title>{`${members[i]?.label}: ${p}%`}</title>
                  </rect>
                );
              })}
              <text
                x={g * groupW + groupW / 2}
                y={H + 13}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {formatDay(week.startsOn, false)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
