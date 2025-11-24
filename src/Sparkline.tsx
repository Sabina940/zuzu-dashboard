// src/components/Sparkline.tsx
import React from "react";

export function Sparkline({
  data,
  color = "#4a6cff",
}: {
  data: number[];
  color?: string;
}) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data
    .map((value, index) => {
      const x = data.length === 1 ? 0 : (index / (data.length - 1)) * 100;
      const normalized = max === min ? 0.5 : (value - min) / (max - min);
      const y = 100 - normalized * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}