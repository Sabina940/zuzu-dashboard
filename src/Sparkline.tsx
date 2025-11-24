// src/Sparkline.tsx

interface Props {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color = "#fbbf24" }: Props) {
  if (!data || data.length === 0) return null;

  const width = 120;
  const height = 36;

  // Make sure all values are numbers
  const safeData = data.map((v) => (Number.isFinite(v) ? v : 0));

  const min = Math.min(...safeData);
  const max = Math.max(...safeData);

  // Avoid division by zero: if all points are equal, treat it as a flat middle line
  let range = max - min;
  if (range === 0) {
    range = 1;
  }

  const stepX =
    safeData.length === 1 ? 0 : width / (safeData.length - 1);

  const points = safeData
    .map((v, i) => {
      const norm = (v - min) / range; // 0..1
      const x = i * stepX;
      const y = height - norm * height; // flip so bigger values are higher
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}