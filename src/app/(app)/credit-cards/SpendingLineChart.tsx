"use client";

import { useState } from "react";
import { formatCurrency, formatYearMonth } from "@/lib/format";

interface SpendingLineChartProps {
  /** 依月份由舊到新排序。 */
  data: { month: string; totalTwd: number }[];
}

const VB_W = 640;
const VB_H = 220;
const PAD_LEFT = 60;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PLOT_W = VB_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = VB_H - PAD_TOP - PAD_BOTTOM;

/** 月份太多時只挑幾個顯示，避免 X 軸標籤重疊。 */
function shortMonthLabel(month: string): string {
  const [, m] = month.split("-");
  return `${Number(m)}月`;
}

export function SpendingLineChart({ data }: SpendingLineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">尚無資料可繪製</p>;
  }

  const maxVal = Math.max(...data.map((d) => d.totalTwd), 1) * 1.15;
  const x = (i: number) =>
    data.length <= 1 ? PAD_LEFT + PLOT_W / 2 : PAD_LEFT + i * (PLOT_W / (data.length - 1));
  const y = (v: number) => PAD_TOP + PLOT_H - (v / maxVal) * PLOT_H;

  const points = data.map((d, i) => ({ ...d, cx: x(i), cy: y(d.totalTwd) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.cx},${p.cy}`).join(" ");

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
    value: maxVal * frac,
    yPos: y(maxVal * frac),
  }));

  const labelStep = Math.max(1, Math.ceil(data.length / 7));
  const active = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height={VB_H}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD_LEFT}
              x2={VB_W - PAD_RIGHT}
              y1={g.yPos}
              y2={g.yPos}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <text x={PAD_LEFT - 8} y={g.yPos + 3} textAnchor="end" fontSize={9} fill="#94a3b8">
              {Math.round(g.value).toLocaleString("zh-TW")}
            </text>
          </g>
        ))}

        {points.map((p, i) =>
          i % labelStep === 0 || i === points.length - 1 ? (
            <text
              key={`xl-${i}`}
              x={p.cx}
              y={VB_H - PAD_BOTTOM + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#94a3b8"
            >
              {shortMonthLabel(p.month)}
            </text>
          ) : null
        )}

        {active && (
          <line
            x1={active.cx}
            x2={active.cx}
            y1={PAD_TOP}
            y2={VB_H - PAD_BOTTOM}
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        <path d={linePath} fill="none" stroke="#334155" strokeWidth={2} strokeLinejoin="round" />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={hoverIndex === i ? 5 : 3}
            fill="#334155"
            stroke="white"
            strokeWidth={1.5}
          />
        ))}

        {points[points.length - 1] && (
          <text
            x={points[points.length - 1].cx}
            y={points[points.length - 1].cy - 10}
            textAnchor="end"
            fontSize={10}
            fontWeight={600}
            fill="#334155"
          >
            {formatCurrency(points[points.length - 1].totalTwd)}
          </text>
        )}

        {points.map((p, i) => (
          <circle
            key={`hit-${i}`}
            cx={p.cx}
            cy={p.cy}
            r={14}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          />
        ))}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute rounded-lg bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg"
          style={{
            left: `${(active.cx / VB_W) * 100}%`,
            top: `${(active.cy / VB_H) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          {formatYearMonth(active.month)} · {formatCurrency(active.totalTwd)}
        </div>
      )}
    </div>
  );
}
