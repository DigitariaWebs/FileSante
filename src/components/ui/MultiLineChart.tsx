type LineSeries = {
  label: string;
  color: string;
  data: number[];
};

type Props = {
  series: LineSeries[];
  labels: string[];
  width?: number;
  height?: number;
};

export function MultiLineChart({
  series,
  labels,
  width = 720,
  height = 220,
}: Props) {
  const padL = 36;
  const padR = 16;
  const padTopBottom = 18;
  const chartW = width - padL - padR;
  const chartH = height - padTopBottom * 2;
  const allValues = series.flatMap((s) => s.data);
  const max = Math.max(1, ...allValues);
  const yTicks = 4;
  const n = Math.max(1, labels.length);
  const stepX = chartW / Math.max(1, n - 1);

  function path(data: number[]): string {
    return data
      .map((v, i) => {
        const x = padL + i * stepX;
        const y = padTopBottom + chartH - (v / max) * chartH;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }

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
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              stroke="var(--ap-hairline)"
              strokeDasharray={i === yTicks ? "0" : "2 3"}
              strokeWidth={1}
            />
            <text
              x={padL - 6}
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

      {/* X labels */}
      {labels.map((lab, i) => {
        const x = padL + i * stepX;
        return (
          <text
            key={`${lab}-${i}`}
            x={x}
            y={height - 4}
            textAnchor="middle"
            className="fill-[var(--ap-ink-muted-48)]"
            fontSize={10}
          >
            {lab}
          </text>
        );
      })}

      {/* Line paths */}
      {series.map((sr) => (
        <path
          key={sr.label}
          d={path(sr.data)}
          stroke={sr.color}
          strokeWidth={1.75}
          fill="none"
        />
      ))}

      {/* Data points */}
      {series.map((sr) =>
        sr.data.map((v, i) => {
          const x = padL + i * stepX;
          const y = padTopBottom + chartH - (v / max) * chartH;
          return (
            <circle
              key={`${sr.label}-${i}`}
              cx={x}
              cy={y}
              r={2.25}
              fill={sr.color}
            >
              <title>{`${sr.label} · ${labels[i]}: ${v}`}</title>
            </circle>
          );
        }),
      )}
    </svg>
  );
}
