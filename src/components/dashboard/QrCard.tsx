"use client";

// Decorative QR placeholder. Renders a deterministic grid from the encoded string.
// Not a scannable QR — pilot demo only.

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) * 16777619;
  }
  return h >>> 0;
}

function next(seed: number): [number, number] {
  // xorshift32
  let x = seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return [(x >>> 0) / 0xffffffff, x >>> 0];
}

export function QrCard({ value, size = 168 }: { value: string; size?: number }) {
  const cells = 21;
  let seed = hashSeed(value);
  const matrix: boolean[][] = [];
  for (let y = 0; y < cells; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < cells; x++) {
      const [r, s2] = next(seed);
      seed = s2;
      row.push(r < 0.5);
    }
    matrix.push(row);
  }

  // Stamp 3 finder squares (top-left, top-right, bottom-left).
  const stampFinder = (cx: number, cy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const dx = cx + x;
        const dy = cy + y;
        if (dx >= cells || dy >= cells) continue;
        const outer = x === 0 || x === 6 || y === 0 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[dy][dx] = outer || inner;
        const gap =
          (x === 1 || x === 5) && y >= 1 && y <= 5
            ? false
            : (y === 1 || y === 5) && x >= 1 && x <= 5
              ? false
              : matrix[dy][dx];
        matrix[dy][dx] = gap;
      }
    }
  };
  stampFinder(0, 0);
  stampFinder(cells - 7, 0);
  stampFinder(0, cells - 7);

  const cell = size / cells;
  return (
    <div
      className="rounded-2xl border border-[var(--fs-line)] bg-white p-3 shadow-sm"
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="#fff" />
        {matrix.map((row, y) =>
          row.map((on, x) =>
            on ? (
              <rect
                key={`${x}-${y}`}
                x={x * cell}
                y={y * cell}
                width={cell}
                height={cell}
                fill="#0c2535"
              />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
}
