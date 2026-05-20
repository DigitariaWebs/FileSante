type Series = {
  label: string;
  color: string;
  data: number[];
};

type Props = {
  series: Series[];
  labels: string[];
  width?: number;
  height?: number;
};

export function BarChart({ series, labels, width = 560, height = 180 }: Props) {
  const padX = 28;
  const padTopBottom = 18;
  const chartW = width - padX * 2;
  const chartH = height - padTopBottom * 2;
  const max = Math.max(1, ...series.flatMap((s) => s.data));
  const groups = labels.length;
  const groupW = chartW / Math.max(1, groups);
  const seriesCount = series.length;
  const innerGap = 2;
  const barW = Math.max(2, groupW / seriesCount - innerGap);

  const yTicks = 4;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {/* Y grid + ticks */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padTopBottom + (chartH * i) / yTicks;
        const val = Math.round((max * (yTicks - i)) / yTicks);
        return (
          <g key={i}>
            <line
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="var(--ap-hairline)"
              strokeDasharray={i === yTicks ? "0" : "2 3"}
              strokeWidth={1}
            />
            <text
              x={padX - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-[var(--ap-ink-muted-48)]"
              fontSize={10}
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {labels.map((lab, gi) => {
        const gx = padX + gi * groupW;
        return (
          <g key={`${lab}-${gi}`}>
            {series.map((sr, si) => {
              const v = sr.data[gi] ?? 0;
              const h = max > 0 ? (v / max) * chartH : 0;
              const x = gx + si * (barW + innerGap) + (groupW - seriesCount * (barW + innerGap)) / 2;
              const y = padTopBottom + chartH - h;
              return (
                <rect
                  key={sr.label}
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(0, h)}
                  rx={2}
                  fill={sr.color}
                >
                  <title>{`${sr.label} · ${lab}: ${v}`}</title>
                </rect>
              );
            })}
            <text
              x={gx + groupW / 2}
              y={height - 4}
              textAnchor="middle"
              className="fill-[var(--ap-ink-muted-48)]"
              fontSize={10}
            >
              {lab}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
