type Slice = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  slices: Slice[];
  size?: number;
  thickness?: number;
};

export function Donut({ slices, size = 180, thickness = 22 }: Props) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const r = size / 2 - thickness;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;
  const arcs = slices.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const len = frac * c;
    const node = {
      ...s,
      frac,
      stroke: s.color,
      dasharray: `${len} ${c - len}`,
      offset: c - offset,
    };
    offset += len;
    return node;
  });

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--ap-canvas-parchment)"
          strokeWidth={thickness}
        />
        {arcs.map((a) => (
          <circle
            key={a.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={a.stroke}
            strokeWidth={thickness}
            strokeDasharray={a.dasharray}
            strokeDashoffset={a.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          >
            <title>{`${a.label}: ${a.value} (${Math.round(a.frac * 100)}%)`}</title>
          </circle>
        ))}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-[var(--ap-ink)]"
          fontSize={20}
          fontWeight={600}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className="fill-[var(--ap-ink-muted-48)]"
          fontSize={11}
        >
          total
        </text>
      </svg>
      <ul className="flex flex-col gap-2 text-[12.5px]">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-[var(--ap-ink-muted-80)]">{s.label}</span>
              <span className="ml-auto font-mono tabular-nums text-[var(--ap-ink)]">
                {s.value}
                <span className="ml-1 text-[var(--ap-ink-muted-48)]">
                  · {pct}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
